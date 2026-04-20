'use client';

import React, { useState } from 'react';

interface WALRecord {
  lsn: number;
  transactionId: string;
  operation: string;
  data: string;
  timestamp: number;
}

interface Page {
  pageId: number;
  data: string;
  lastLSN: number;
}

export default function WALPage() {
  const [walRecords, setWalRecords] = useState<WALRecord[]>([]);
  const [pages, setPages] = useState<Page[]>([
    { pageId: 1, data: 'Initial data', lastLSN: 0 },
    { pageId: 2, data: 'Initial data', lastLSN: 0 }
  ]);
  const [currentTransaction, setCurrentTransaction] = useState<string | null>(null);
  const [transactionCounter, setTransactionCounter] = useState(1);
  const [lsnCounter, setLsnCounter] = useState(1);
  const [hoveredRecord, setHoveredRecord] = useState<number | null>(null);
  const [clickedRecord, setClickedRecord] = useState<number | null>(null);
  const [showCheckpoint, setShowCheckpoint] = useState(false);

  const beginTransaction = () => {
    const txId = `TX${transactionCounter}`;
    setCurrentTransaction(txId);
    setTransactionCounter(prev => prev + 1);

    const newRecord: WALRecord = {
      lsn: lsnCounter,
      transactionId: txId,
      operation: 'BEGIN',
      data: 'Transaction started',
      timestamp: Date.now()
    };

    setWalRecords(prev => [...prev, newRecord]);
    setLsnCounter(prev => prev + 1);
  };

  const writePage = (pageId: number, newData: string) => {
    if (!currentTransaction) {
      alert('Please begin a transaction first!');
      return;
    }

    const newRecord: WALRecord = {
      lsn: lsnCounter,
      transactionId: currentTransaction,
      operation: 'UPDATE',
      data: `Page ${pageId}: ${newData}`,
      timestamp: Date.now()
    };

    setWalRecords(prev => [...prev, newRecord]);
    setLsnCounter(prev => prev + 1);

    // Update page with LSN pointer
    setPages(prev => prev.map(p =>
      p.pageId === pageId
        ? { ...p, data: newData, lastLSN: lsnCounter }
        : p
    ));
  };

  const commitTransaction = () => {
    if (!currentTransaction) return;

    const newRecord: WALRecord = {
      lsn: lsnCounter,
      transactionId: currentTransaction,
      operation: 'COMMIT',
      data: 'Transaction committed',
      timestamp: Date.now()
    };

    setWalRecords(prev => [...prev, newRecord]);
    setLsnCounter(prev => prev + 1);
    setCurrentTransaction(null);
  };

  const rollbackTransaction = () => {
    if (!currentTransaction) return;

    const newRecord: WALRecord = {
      lsn: lsnCounter,
      transactionId: currentTransaction,
      operation: 'ROLLBACK',
      data: 'Transaction rolled back',
      timestamp: Date.now()
    };

    setWalRecords(prev => [...prev, newRecord]);
    setLsnCounter(prev => prev + 1);
    setCurrentTransaction(null);
  };

  const createCheckpoint = () => {
    setShowCheckpoint(true);
    setTimeout(() => setShowCheckpoint(false), 2000);
  };

  const simulateCrash = () => {
    // In a real scenario, database would crash
    // Recovery would read WAL from last checkpoint
    const lastCommittedLSN = walRecords
      .filter(r => r.operation === 'COMMIT')
      .map(r => r.lsn)
      .pop() || 0;

    alert(`💥 Database crashed!\n\nRecovery would replay WAL from LSN ${lastCommittedLSN}`);
  };

  const handleRecordClick = (lsn: number) => {
    if (clickedRecord === lsn) {
      setClickedRecord(null);
    } else {
      setClickedRecord(lsn);
    }
  };

  const getRecordInfo = (record: WALRecord) => {
    return {
      title: `LSN ${record.lsn}: ${record.operation}`,
      content: `Transaction: ${record.transactionId}\nData: ${record.data}\nTimestamp: ${new Date(record.timestamp).toLocaleTimeString()}`
    };
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'BEGIN': return '#10b981';
      case 'UPDATE': return '#f59e0b';
      case 'COMMIT': return '#e07060';
      case 'ROLLBACK': return '#c75a5a';
      default: return '#888888';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Chapter Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Write-Ahead Logging (WAL)
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Understand how databases maintain ACID properties and recover from crashes using Write-Ahead Logging.
        </p>
      </div>

      {/* Explanation Section */}
      <div className="mb-12 p-6 rounded-lg" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--grid-line)' }}>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          What is Write-Ahead Logging?
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          Write-Ahead Logging (WAL) is the core mechanism that databases use to ensure atomicity and durability. Before any data is written to disk, the change is first written to a sequential append-only log.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          <strong>The Golden Rule of WAL:</strong> Write the log before writing the data. This ensures that if the database crashes, it can recover by replaying the log entries.
        </p>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <strong>Benefits:</strong> WAL enables crash recovery, replication, point-in-time recovery, and improves performance by converting random disk writes into sequential ones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* WAL Visualization */}
        <div className="lg:col-span-2 p-8 rounded-xl shadow-lg relative" style={{ background: 'var(--surface)' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              WAL Log
            </h2>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Records: {walRecords.length}
            </div>
          </div>

          {/* WAL Records */}
          <div className="space-y-2 mb-6" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {walRecords.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                No WAL records yet. Begin a transaction to start.
              </div>
            ) : (
              walRecords.map((record) => {
                const isHovered = hoveredRecord === record.lsn;
                const isClicked = clickedRecord === record.lsn;

                return (
                  <div
                    key={record.lsn}
                    className="p-3 rounded border-2 cursor-pointer transition-all hover-overlay"
                    style={{
                      background: isClicked ? 'var(--surface-elevated)' : 'var(--bg)',
                      borderColor: isClicked ? 'var(--accent-coral)' : 'var(--grid-line)',
                      borderLeftWidth: '6px',
                      borderLeftColor: getOperationColor(record.operation),
                      transform: isHovered ? 'scale(1.02)' : 'scale(1)'
                    }}
                    onClick={() => handleRecordClick(record.lsn)}
                    onMouseEnter={() => setHoveredRecord(record.lsn)}
                    onMouseLeave={() => setHoveredRecord(null)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                          LSN {record.lsn}
                        </span>
                        <span className="mx-2" style={{ color: 'var(--text-muted)' }}>→</span>
                        <span className="font-semibold" style={{ color: getOperationColor(record.operation) }}>
                          {record.operation}
                        </span>
                        <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {record.transactionId}
                        </span>
                      </div>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        {record.data}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Buffer Pages */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Buffer Pool Pages
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {pages.map((page) => (
                <div key={page.pageId} className="p-4 rounded-lg" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--grid-line)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Page {page.pageId}
                    </h4>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      LSN: {page.lastLSN}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {page.data}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Checkpoint Indicator */}
          {showCheckpoint && (
            <div className="absolute top-8 right-8 px-4 py-2 rounded-lg" style={{ background: 'var(--accent-coral)', color: 'white' }}>
              💾 Checkpoint Created
            </div>
          )}

          {/* Clicked Record Info */}
          {clickedRecord !== null && (
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg backdrop-blur-sm border-2 z-10" style={{ background: 'rgba(26, 25, 24, 0.9)', borderColor: 'var(--accent-coral)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>
                    {getRecordInfo(walRecords.find(r => r.lsn === clickedRecord)!)?.title}
                  </h4>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                    {getRecordInfo(walRecords.find(r => r.lsn === clickedRecord)!)?.content}
                  </p>
                </div>
                <button
                  onClick={() => setClickedRecord(null)}
                  className="font-bold text-xl leading-none hover-overlay"
                  style={{ color: 'var(--accent-coral)' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="p-6 rounded-xl shadow-lg" style={{ background: 'var(--surface)' }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Transaction Controls
          </h3>

          {/* Transaction Status */}
          <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
            <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
              Current Transaction
            </h4>
            <div className="text-lg font-mono" style={{ color: currentTransaction ? 'var(--accent-coral)' : 'var(--text-muted)' }}>
              {currentTransaction || 'None'}
            </div>
          </div>

          {/* Transaction Operations */}
          <div className="space-y-3 mb-6">
            {!currentTransaction ? (
              <button
                onClick={beginTransaction}
                className="w-full px-4 py-3 rounded-lg font-medium transition-colors hover-overlay text-white"
                style={{ background: 'var(--accent-coral)' }}
              >
                BEGIN TRANSACTION
              </button>
            ) : (
              <>
                <button
                  onClick={() => writePage(1, `Updated data ${Date.now()}`)}
                  className="w-full px-4 py-3 rounded-lg font-medium transition-colors hover-overlay"
                  style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                >
                  UPDATE Page 1
                </button>
                <button
                  onClick={() => writePage(2, `Updated data ${Date.now()}`)}
                  className="w-full px-4 py-3 rounded-lg font-medium transition-colors hover-overlay"
                  style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                >
                  UPDATE Page 2
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={commitTransaction}
                    className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors hover-overlay text-white"
                    style={{ background: 'var(--accent-coral)' }}
                  >
                    COMMIT
                  </button>
                  <button
                    onClick={rollbackTransaction}
                    className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors hover-overlay"
                    style={{ background: 'var(--danger)', color: 'white' }}
                  >
                    ROLLBACK
                  </button>
                </div>
              </>
            )}
          </div>

          {/* System Operations */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              System Operations
            </h4>
            <div className="space-y-2">
              <button
                onClick={createCheckpoint}
                className="w-full px-4 py-2 rounded text-sm transition-colors hover-overlay"
                style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
              >
                💾 Create Checkpoint
              </button>
              <button
                onClick={simulateCrash}
                className="w-full px-4 py-2 rounded text-sm transition-colors hover-overlay"
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                💥 Simulate Crash
              </button>
              <button
                onClick={() => { setWalRecords([]); setPages([{ pageId: 1, data: 'Initial data', lastLSN: 0 }, { pageId: 2, data: 'Initial data', lastLSN: 0 }]); setCurrentTransaction(null); }}
                className="w-full px-4 py-2 rounded text-sm transition-colors hover-overlay"
                style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              Statistics
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Total Records:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{walRecords.length}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Transactions:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{Math.ceil(transactionCounter / 2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Next LSN:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{lsnCounter}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--grid-line)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>Atomicity</h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            All changes in a transaction either succeed or fail together. WAL ensures partial transactions can be undone.
          </p>
        </div>

        <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--grid-line)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>Durability</h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Once committed, changes survive crashes. WAL is flushed to disk before the transaction returns.
          </p>
        </div>

        <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--grid-line)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>Crash Recovery</h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            After a crash, database replays WAL from the last checkpoint to restore consistency.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: 'var(--grid-line)' }}>
        <a
          href="/chapters/b-trees"
          className="font-medium hover-overlay"
          style={{ color: 'var(--accent-coral)' }}
        >
          ← B-Tree Indexing
        </a>
        <a
          href="/chapters/query-planning"
          className="px-6 py-3 text-white rounded-lg font-medium transition-colors hover-overlay"
          style={{ background: 'var(--accent-coral)' }}
        >
          Next: Query Planning →
        </a>
      </div>
    </div>
  );
}

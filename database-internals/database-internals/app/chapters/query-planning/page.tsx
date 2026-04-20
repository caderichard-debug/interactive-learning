'use client';

import React, { useState, useMemo } from 'react';

interface QueryPlanNode {
  id: string;
  type: 'Seq Scan' | 'Index Scan' | 'Hash Join' | 'Nested Loop' | 'Sort' | 'Aggregate' | 'Hash';
  table?: string;
  condition?: string;
  cost: {
    startup: number;
    total: number;
  };
  rows: number;
  width: number;
  children: QueryPlanNode[];
}

interface DatabaseTable {
  name: string;
  rowCount: number;
  columns: Array<{
    name: string;
    type: string;
    indexed: boolean;
  }>;
}

export default function QueryPlanningPage() {
  const [selectedQuery, setSelectedQuery] = useState('simple');
  const [currentPlan, setCurrentPlan] = useState<QueryPlanNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [rowEstimate, setRowEstimate] = useState(10000);
  const [workMem, setWorkMem] = useState(4); // MB
  const [useIndex, setUseIndex] = useState(true);

  const tables: DatabaseTable[] = [
    {
      name: 'users',
      rowCount: 10000,
      columns: [
        { name: 'id', type: 'integer', indexed: true },
        { name: 'name', type: 'text', indexed: false },
        { name: 'email', type: 'text', indexed: true },
        { name: 'created_at', type: 'timestamp', indexed: false }
      ]
    },
    {
      name: 'orders',
      rowCount: 50000,
      columns: [
        { name: 'id', type: 'integer', indexed: true },
        { name: 'user_id', type: 'integer', indexed: true },
        { name: 'total', type: 'decimal', indexed: false },
        { name: 'status', type: 'text', indexed: true }
      ]
    }
  ];

  const queryTemplates = {
    simple: {
      name: 'Simple SELECT',
      sql: `SELECT * FROM users WHERE email = 'user@example.com'`,
      description: 'Single table with indexed WHERE clause'
    },
    join: {
      name: 'Inner Join',
      sql: `SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'complete'`,
      description: 'Join users with orders on indexed columns'
    },
    aggregation: {
      name: 'Aggregation',
      sql: `SELECT user_id, COUNT(*), SUM(total)
FROM orders
WHERE total > 100
GROUP BY user_id`,
      description: 'Aggregate with GROUP BY and HAVING'
    },
    range: {
      name: 'Range Query',
      sql: `SELECT * FROM orders
WHERE total BETWEEN 100 AND 500
ORDER BY created_at`,
      description: 'Range scan with sorting'
    }
  };

  const generatePlan = (queryType: string): QueryPlanNode => {
    const baseCost = Math.log2(rowEstimate) * 0.1;

    switch (queryType) {
      case 'simple':
        if (useIndex) {
          return {
            id: '1',
            type: 'Index Scan',
            table: 'users',
            condition: 'email = \'user@example.com\'',
            cost: { startup: 0.01, total: 1.2 + baseCost },
            rows: 1,
            width: 48,
            children: []
          };
        } else {
          return {
            id: '1',
            type: 'Seq Scan',
            table: 'users',
            condition: 'email = \'user@example.com\'',
            cost: { startup: 0, total: rowEstimate * 0.01 },
            rows: 1,
            width: 48,
            children: []
          };
        }

      case 'join':
        return {
          id: '1',
          type: 'Hash Join',
          cost: { startup: 5.5, total: 45.23 + baseCost },
          rows: 1250,
          width: 32,
          children: [
            {
              id: '2',
              type: 'Hash',
              cost: { startup: 0, total: 12.5 },
              rows: 10000,
              width: 16,
              children: [
                {
                  id: '3',
                  type: 'Seq Scan',
                  table: 'users',
                  cost: { startup: 0, total: 12.5 },
                  rows: 10000,
                  width: 16,
                  children: []
                }
              ]
            },
            {
              id: '4',
              type: 'Seq Scan',
              table: 'orders',
              condition: 'status = \'complete\'',
              cost: { startup: 0, total: 25.5 },
              rows: 12500,
              width: 24,
              children: []
            }
          ]
        };

      case 'aggregation':
        return {
          id: '1',
          type: 'Aggregate',
          cost: { startup: 12.3, total: 28.7 + baseCost },
          rows: 500,
          width: 24,
          children: [
            {
              id: '2',
              type: 'Seq Scan',
              table: 'orders',
              condition: 'total > 100',
              cost: { startup: 0, total: 25.0 },
              rows: 15000,
              width: 20,
              children: []
            }
          ]
        };

      case 'range':
        return {
          id: '1',
          type: 'Sort',
          cost: { startup: 15.2, total: 42.8 + baseCost },
          rows: 2500,
          width: 28,
          children: [
            {
              id: '2',
              type: 'Seq Scan',
              table: 'orders',
              condition: 'total BETWEEN 100 AND 500',
              cost: { startup: 0, total: 22.5 },
              rows: 2500,
              width: 28,
              children: []
            }
          ]
        };

      default:
        return {
          id: '1',
          type: 'Seq Scan',
          table: 'users',
          cost: { startup: 0, total: 10 },
          rows: 1000,
          width: 16,
          children: []
        };
    }
  };

  const joinAlgorithms = {
    hash: { name: 'Hash Join', time: 12, color: '#e07060', best: true },
    nestedLoop: { name: 'Nested Loop', time: 45, color: '#8b5cf6', best: false },
    mergeJoin: { name: 'Merge Join', time: 28, color: '#5ba3b5', best: false }
  };

  const analyzeQuery = () => {
    const plan = generatePlan(selectedQuery);
    setCurrentPlan(plan);
    setSelectedNode(null);
  };

  const renderPlanNode = (node: QueryPlanNode, depth: number = 0): React.ReactElement => {
    const isSelected = selectedNode === node.id;
    const nodeColor = getNodeColor(node.type);

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover-overlay ${
            isSelected ? 'scale-105' : 'scale-100'
          }`}
          style={{
            background: isSelected ? 'var(--surface-elevated)' : 'var(--bg)',
            borderColor: isSelected ? 'var(--accent-coral)' : nodeColor,
            minWidth: '150px',
            marginLeft: `${depth * 40}px`
          }}
          onClick={() => setSelectedNode(isSelected ? null : node.id)}
        >
          <div className="font-bold text-sm" style={{ color: nodeColor }}>
            {node.type}
          </div>
          {node.table && (
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {node.table}
            </div>
          )}
          {node.condition && (
            <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {node.condition}
            </div>
          )}
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Cost: {node.cost.total.toFixed(2)}
          </div>
        </div>

        {node.children.length > 0 && (
          <div className="flex gap-4 mt-2">
            {node.children.map((child, i) => (
              <div key={i} className="relative">
                <div
                  className="absolute w-px"
                  style={{
                    background: 'var(--grid-line)',
                    height: '20px',
                    left: '50%',
                    top: '-20px'
                  }}
                />
                {renderPlanNode(child, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getNodeColor = (type: string): string => {
    switch (type) {
      case 'Hash Join': return '#e07060';
      case 'Nested Loop': return '#8b5cf6';
      case 'Merge Join': return '#5ba3b5';
      case 'Seq Scan': return '#10b981';
      case 'Index Scan': return '#f59e0b';
      case 'Sort': return '#8b7aa8';
      case 'Aggregate': return '#5a9a6e';
      case 'Hash': return '#c9a86c';
      default: return '#888888';
    }
  };

  const totalCost = currentPlan?.cost.total || 0;
  const costBreakdown = currentPlan ? {
    planning: totalCost * 0.05,
    execution: totalCost * 0.85,
    overhead: totalCost * 0.10
  } : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Chapter Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Query Planning & Optimization
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Understand how databases optimize and execute your SQL queries
        </p>
      </div>

      {/* Explanation Section */}
      <div className="mb-12 p-6 rounded-lg" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--grid-line)' }}>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          What is Query Planning?
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          When you execute a SQL query, the database doesn't just run it as-is. First, it analyzes multiple possible execution strategies, estimates their costs using statistics, and chooses the most efficient plan. This process is called query planning.
        </p>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          The planner considers factors like: available indexes, data distribution, memory limits, and join algorithms. Small changes in your query or schema can dramatically affect the chosen plan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Main Visualization Area */}
        <div className="lg:col-span-2 p-8 rounded-xl shadow-lg" style={{ background: 'var(--surface)' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Query Builder
            </h2>
          </div>

          {/* Query Templates */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Query Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(queryTemplates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => setSelectedQuery(key)}
                  className={`p-3 rounded text-left transition-all hover-overlay ${
                    selectedQuery === key
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    background: selectedQuery === key ? 'var(--accent-coral)' : 'var(--surface-elevated)',
                    color: selectedQuery === key ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  <div className="font-semibold text-sm">{template.name}</div>
                  <div className="text-xs opacity-80">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* SQL Editor */}
          <div className="mb-6">
            <div className="p-4 rounded-lg border-2 font-mono text-sm" style={{
              background: 'var(--bg)',
              borderColor: 'var(--grid-line)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)'
            }}>
              {queryTemplates[selectedQuery as keyof typeof queryTemplates].sql}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={analyzeQuery}
                className="px-4 py-2 rounded font-medium transition-colors hover-overlay text-white"
                style={{ background: 'var(--accent-coral)' }}
              >
                ▶ Explain Query
              </button>
              <button
                onClick={() => setUseIndex(!useIndex)}
                className={`px-4 py-2 rounded font-medium transition-colors hover-overlay ${
                  useIndex ? 'text-white' : ''
                }`}
                style={{
                  background: useIndex ? 'var(--accent-coral)' : 'var(--surface-elevated)',
                  color: useIndex ? 'white' : 'var(--text-secondary)'
                }}
              >
                {useIndex ? '✓ Index ON' : '✗ Index OFF'}
              </button>
            </div>
          </div>

          {/* Execution Plan */}
          {currentPlan && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Execution Plan
              </h3>
              <div className="p-6 rounded-lg" style={{ background: 'var(--surface-elevated)', minHeight: '300px' }}>
                {renderPlanNode(currentPlan)}
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                Click on nodes to see detailed information
              </p>
            </div>
          )}

          {/* Node Details */}
          {selectedNode && currentPlan && (
            <div className="p-4 rounded-lg border-2" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--accent-coral)' }}>
              <h4 className="font-bold mb-2" style={{ color: 'var(--accent-coral)' }}>
                Node Details
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Type:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{currentPlan.type}</span>
                </div>
                {currentPlan.table && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Table:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{currentPlan.table}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Startup Cost:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{currentPlan.cost.startup.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Total Cost:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{currentPlan.cost.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Rows:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{currentPlan.rows}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Width:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{currentPlan.width} bytes</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="p-6 rounded-xl shadow-lg" style={{ background: 'var(--surface)' }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Planner Settings
          </h3>

          {/* Schema Browser */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Schema
            </h4>
            <div className="space-y-2">
              {tables.map((table) => (
                <div key={table.name} className="p-3 rounded" style={{ background: 'var(--surface-elevated)' }}>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    📁 {table.name} ({table.rowCount.toLocaleString()} rows)
                  </div>
                  <div className="text-xs space-y-1 mt-2">
                    {table.columns.map((col) => (
                      <div key={col.name} className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: col.indexed ? 'var(--accent-coral)' : 'var(--text-muted)' }}>
                          {col.indexed ? '🔑' : '•'}
                        </span>
                        <span>{col.name}: {col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Estimation Controls */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Cost Estimation
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Row Count Estimate: {rowEstimate.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={rowEstimate}
                  onChange={(e) => setRowEstimate(parseInt(e.target.value))}
                  className="w-full h-2 rounded appearance-none cursor-pointer"
                  style={{ background: 'var(--surface-elevated)', accentColor: 'var(--accent-coral)' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Work Memory: {workMem} MB
                </label>
                <input
                  type="range"
                  min="1"
                  max="64"
                  step="1"
                  value={workMem}
                  onChange={(e) => setWorkMem(parseInt(e.target.value))}
                  className="w-full h-2 rounded appearance-none cursor-pointer"
                  style={{ background: 'var(--surface-elevated)', accentColor: 'var(--accent-coral)' }}
                />
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          {costBreakdown && (
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                Cost Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Planning:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{costBreakdown.planning.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Execution:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{costBreakdown.execution.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Overhead:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{costBreakdown.overhead.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--grid-line)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--accent-coral)' }}>{totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Join Algorithm Comparison */}
      {selectedQuery === 'join' && currentPlan && (
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Join Algorithm Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(joinAlgorithms).map(([key, algo]) => (
              <div key={key} className={`p-6 rounded-lg border-2 ${algo.best ? 'border-coral' : ''}`} style={{
                background: 'var(--surface-elevated)',
                borderColor: algo.best ? 'var(--accent-coral)' : 'var(--grid-line)'
              }}>
                <h4 className="font-bold mb-2" style={{ color: algo.color }}>
                  {algo.name}
                </h4>
                <div className="mb-3">
                  <div className="text-2xl font-bold" style={{ color: algo.color }}>
                    {algo.time}ms
                  </div>
                  {algo.best && (
                    <div className="text-xs" style={{ color: 'var(--accent-coral)' }}>
                      ✓ Selected for this query
                    </div>
                  )}
                </div>
                <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(algo.time / 50) * 100}%`,
                      background: algo.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--grid-line)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>Cost Estimation</h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Databases use statistics to estimate row counts and I/O costs for each possible plan.
          </p>
        </div>

        <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--grid-line)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>Join Algorithms</h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Hash joins excel at large unsorted data, nested loops for small tables, merge joins for sorted inputs.
          </p>
        </div>

        <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--grid-line)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>Index Usage</h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Indexes can dramatically speed up queries but add overhead for writes. The planner considers both.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: 'var(--grid-line)' }}>
        <a
          href="/chapters/wal"
          className="font-medium hover-overlay"
          style={{ color: 'var(--accent-coral)' }}
        >
          ← Write-Ahead Logging
        </a>
        <a
          href="/chapters/mvcc"
          className="px-6 py-3 text-white rounded-lg font-medium transition-colors hover-overlay"
          style={{ background: 'var(--accent-coral)' }}
        >
          Next: MVCC →
        </a>
      </div>
    </div>
  );
}

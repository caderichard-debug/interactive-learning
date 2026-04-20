'use client';

import React, { useState, useCallback } from 'react';

interface BTreeNode {
  keys: number[];
  children: BTreeNode[];
  isLeaf: boolean;
}

const createNode = (isLeaf: boolean = true): BTreeNode => ({
  keys: [],
  children: [],
  isLeaf
});

const B_TREE_ORDER = 3; // Minimum degree
const MAX_KEYS = 2 * B_TREE_ORDER - 1; // 5
const MIN_KEYS = B_TREE_ORDER - 1; // 2

export default function BTreePage() {
  const [root, setRoot] = useState<BTreeNode>(createNode(true));
  const [searchKey, setSearchKey] = useState('');
  const [deleteKey, setDeleteKey] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{keys: string, path: string} | null>(null);
  const [clickedNode, setClickedNode] = useState<{keys: string, path: string} | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [operationHistory, setOperationHistory] = useState<string[]>([]);

  const insert = useCallback(async (key: number) => {
    const newRoot = { ...root };
    const history: string[] = [];

    const insertHelper = (node: BTreeNode, key: number): BTreeNode => {
      history.push(`Checking node with keys: [${node.keys.join(', ')}]`);

      if (node.isLeaf) {
        const insertIndex = node.keys.findIndex(k => k >= key);
        if (insertIndex === -1) {
          node.keys.push(key);
        } else {
          node.keys.splice(insertIndex, 0, key);
        }
        history.push(`Inserted key ${key} into leaf node`);
      } else {
        let childIndex = 0;
        while (childIndex < node.keys.length && key > node.keys[childIndex]) {
          childIndex++;
        }

        const child = insertHelper(node.children[childIndex], key);

        if (child.keys.length > MAX_KEYS) {
          const splitIndex = Math.floor(child.keys.length / 2);
          const midKey = child.keys[splitIndex];

          const newChild: BTreeNode = {
            keys: child.keys.slice(splitIndex + 1),
            children: child.isLeaf ? [] : child.children.slice(splitIndex + 1),
            isLeaf: child.isLeaf
          };

          child.keys = child.keys.slice(0, splitIndex);
          if (!child.isLeaf) {
            child.children = child.children.slice(0, splitIndex + 1);
          }

          node.keys.splice(childIndex, 0, midKey);
          node.children.splice(childIndex + 1, 0, newChild);

          history.push(`Split node! Promoted key ${midKey} to parent`);
        }
      }

      return node;
    };

    const result = insertHelper(newRoot, key);

    if (result.keys.length > MAX_KEYS) {
      const splitIndex = Math.floor(result.keys.length / 2);
      const midKey = result.keys[splitIndex];

      const newRoot = createNode(false);
      newRoot.keys.push(midKey);

      const leftChild: BTreeNode = {
        keys: result.keys.slice(0, splitIndex),
        children: result.isLeaf ? [] : result.children.slice(0, splitIndex + 1),
        isLeaf: result.isLeaf
      };

      const rightChild: BTreeNode = {
        keys: result.keys.slice(splitIndex + 1),
        children: result.isLeaf ? [] : result.children.slice(splitIndex + 1),
        isLeaf: result.isLeaf
      };

      newRoot.children.push(leftChild, rightChild);

      history.push(`Root split! New root created with key ${midKey}`);
      setRoot(newRoot);
    } else {
      setRoot(result);
    }

    setOperationHistory(history);
  }, [root]);

  const search = useCallback((key: number) => {
    const path: string[] = [];

    const searchHelper = (node: BTreeNode, key: number): boolean => {
      path.push(`Checking node: [${node.keys.join(', ')}]`);

      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) {
        i++;
      }

      if (i < node.keys.length && node.keys[i] === key) {
        path.push(`Found key ${key}!`);
        return true;
      }

      if (node.isLeaf) {
        path.push(`Key ${key} not found in tree`);
        return false;
      }

      return searchHelper(node.children[i], key);
    };

    const found = searchHelper(root, key);
    setSearchResult(found ? `Found ${key}!\n\nPath:\n${path.join('\n')}` : `Not found!\n\nPath:\n${path.join('\n')}`);
  }, [root]);

  const removeKey = useCallback((key: number) => {
    // Simplified deletion for demo
    const removeHelper = (node: BTreeNode, key: number): BTreeNode => {
      const keyIndex = node.keys.indexOf(key);

      if (keyIndex !== -1) {
        if (node.isLeaf) {
          node.keys.splice(keyIndex, 1);
        } else {
          // Replace with predecessor or successor (simplified)
          if (node.children[keyIndex].keys.length > MIN_KEYS) {
            const pred = getPredecessor(node.children[keyIndex]);
            node.keys[keyIndex] = pred;
            removeHelper(node.children[keyIndex], pred);
          } else if (node.children[keyIndex + 1].keys.length > MIN_KEYS) {
            const succ = getSuccessor(node.children[keyIndex + 1]);
            node.keys[keyIndex] = succ;
            removeHelper(node.children[keyIndex + 1], succ);
          } else {
            // Merge children (simplified)
            const leftChild = node.children[keyIndex];
            const rightChild = node.children[keyIndex + 1];

            leftChild.keys.push(node.keys[keyIndex], ...rightChild.keys);
            if (!leftChild.isLeaf) {
              leftChild.children.push(...rightChild.children);
            }

            node.keys.splice(keyIndex, 1);
            node.children.splice(keyIndex + 1, 1);
            node.children[keyIndex] = leftChild;
          }
        }
        return node;
      }

      let childIndex = 0;
      while (childIndex < node.keys.length && key > node.keys[childIndex]) {
        childIndex++;
      }

      if (!node.isLeaf && childIndex < node.children.length) {
        node.children[childIndex] = removeHelper(node.children[childIndex], key);
      }

      return node;
    };

    const getPredecessor = (node: BTreeNode): number => {
      while (!node.isLeaf && node.children.length > 0) {
        node = node.children[node.children.length - 1];
      }
      return node.keys[node.keys.length - 1];
    };

    const getSuccessor = (node: BTreeNode): number => {
      while (!node.isLeaf && node.children.length > 0) {
        node = node.children[0];
      }
      return node.keys[0];
    };

    const newRoot = removeHelper({ ...root }, key);

    // Handle empty root
    if (newRoot.keys.length === 0 && !newRoot.isLeaf && newRoot.children.length > 0) {
      setRoot(newRoot.children[0]);
    } else {
      setRoot(newRoot);
    }

    setOperationHistory([`Deleted key ${key}`]);
  }, [root]);

  const handleInsert = () => {
    const key = parseInt(searchKey);
    if (!isNaN(key) && key >= 0 && key <= 999) {
      insert(key);
      setSearchKey('');
      setSearchResult(null);
    }
  };

  const handleSearch = () => {
    const key = parseInt(searchKey);
    if (!isNaN(key)) {
      search(key);
    }
  };

  const handleDelete = () => {
    const key = parseInt(deleteKey);
    if (!isNaN(key)) {
      removeKey(key);
      setDeleteKey('');
      setSearchResult(null);
    }
  };

  const handleNodeClick = (nodeKeys: string, path: string) => {
    if (clickedNode?.keys === nodeKeys) {
      setClickedNode(null);
    } else {
      setClickedNode({ keys: nodeKeys, path });
    }
  };

  const getNodeInfo = (nodeData: {keys: string, path: string}) => {
    return {
      title: `Node: [${nodeData.keys}]`,
      content: `Keys: ${nodeData.keys}\nPath: ${nodeData.path}\nThis is a B-Tree node with a maximum of ${MAX_KEYS} keys.`
    };
  };

  const renderNode = (node: BTreeNode, x: number, y: number, path: string = 'root') => {
    const nodeWidth = 160;
    const nodeHeight = 50;
    const keyWidth = 30;
    const totalWidth = Math.max(nodeWidth, node.keys.length * keyWidth + 20);

    const nodeKey = `${node.keys.join('-')}-${path}`;
    const isHovered = hoveredNode?.keys === nodeKey;
    const isClicked = clickedNode?.keys === nodeKey;

    return (
      <g key={nodeKey}>
        {/* Node box */}
        <rect
          x={x - totalWidth / 2}
          y={y}
          width={totalWidth}
          height={nodeHeight}
          fill={isClicked || isHovered ? '#1a1918' : '#21201e'}
          stroke={isClicked ? '#e07060' : '#333333'}
          strokeWidth={isClicked ? 3 : 2}
          className="cursor-pointer hover-overlay"
          onClick={() => handleNodeClick(nodeKey, path)}
          onMouseEnter={() => setHoveredNode({ keys: nodeKey, path })}
          onMouseLeave={() => setHoveredNode(null)}
          rx="4"
        />

        {/* Keys */}
        {node.keys.map((key, i) => (
          <text
            key={i}
            x={x - totalWidth / 2 + 10 + i * keyWidth}
            y={y + 30}
            fontSize="14"
            fill="#e7e5e2"
            className="pointer-events-none"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {key}
          </text>
        ))}

        {/* Children */}
        {!node.isLeaf && node.children.length > 0 && (
          <>
            {node.children.map((child, i) => {
              const childX = x + (i - node.children.length / 2 + 0.5) * 200;
              const childY = y + 100;
              const childPath = `${path}-${i}`;

              return (
                <g key={i}>
                  {/* Connection line */}
                  <line
                    x1={x}
                    y1={y + nodeHeight}
                    x2={childX}
                    y2={childY}
                    stroke="#333333"
                    strokeWidth="2"
                  />
                  {renderNode(child, childX, childY, childPath)}
                </g>
              );
            })}
          </>
        )}
      </g>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Chapter Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          B-Tree Indexing
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Interactive B-Tree visualization with insert, delete, and search operations.
        </p>
      </div>

      {/* Explanation Section */}
      <div className="mb-12 p-6 rounded-lg" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--grid-line)' }}>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          What is a B-Tree?
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          A B-Tree is a self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time. Unlike binary search trees, B-Tree nodes can have many children (defined by the order).
        </p>
        <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          <strong>Key Properties:</strong> Every node has at most m children (where m is the order), all leaves are at the same depth, and keys are stored in sorted order within each node.
        </p>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <strong>Why B-Trees?</strong> They minimize disk I/O by keeping related data on the same disk page, making them ideal for database indexing and file systems.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* B-Tree Visualization */}
        <div className="lg:col-span-2 p-8 rounded-xl shadow-lg relative" style={{ background: 'var(--surface)' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              B-Tree Visualization
            </h2>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Order: {B_TREE_ORDER} | Max Keys: {MAX_KEYS} | Min Keys: {MIN_KEYS}
            </div>
          </div>

          {/* Tree visualization */}
          <div className="overflow-auto mb-6" style={{ maxHeight: '600px' }}>
            <svg viewBox="-400 0 800 600" className="w-full" style={{ minHeight: '500px' }}>
              {renderNode(root, 0, 50)}
            </svg>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg backdrop-blur-sm border-2" style={{ background: 'rgba(26, 25, 24, 0.9)', borderColor: 'var(--accent-coral)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>
                    Search Result
                  </h4>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                    {searchResult}
                  </p>
                </div>
                <button
                  onClick={() => setSearchResult(null)}
                  className="font-bold text-xl leading-none hover-overlay"
                  style={{ color: 'var(--accent-coral)' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Clicked Node Info */}
          {clickedNode && (
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg backdrop-blur-sm border-2 z-10" style={{ background: 'rgba(26, 25, 24, 0.9)', borderColor: 'var(--accent-coral)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>
                    {getNodeInfo(clickedNode).title}
                  </h4>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                    {getNodeInfo(clickedNode).content}
                  </p>
                </div>
                <button
                  onClick={() => setClickedNode(null)}
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
            Controls
          </h3>

          {/* Insert */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Insert Key (0-999)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="999"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="flex-1 px-3 py-2 rounded border"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--grid-line)',
                  fontFamily: 'var(--font-mono)'
                }}
                placeholder="Enter key..."
                onKeyPress={(e) => e.key === 'Enter' && handleInsert()}
              />
              <button
                onClick={handleInsert}
                className="px-4 py-2 rounded font-medium transition-colors hover-overlay text-white"
                style={{ background: 'var(--accent-coral)' }}
              >
                Insert
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Search Key
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="flex-1 px-3 py-2 rounded border"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--grid-line)',
                  fontFamily: 'var(--font-mono)'
                }}
                placeholder="Enter key..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded font-medium transition-colors hover-overlay text-white"
                style={{ background: 'var(--accent-coral)' }}
              >
                Search
              </button>
            </div>
          </div>

          {/* Delete */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Delete Key
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={deleteKey}
                onChange={(e) => setDeleteKey(e.target.value)}
                className="flex-1 px-3 py-2 rounded border"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--grid-line)',
                  fontFamily: 'var(--font-mono)'
                }}
                placeholder="Enter key..."
                onKeyPress={(e) => e.key === 'Enter' && handleDelete()}
              />
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded font-medium transition-colors hover-overlay"
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Quick Actions
            </label>
            <div className="space-y-2">
              <button
                onClick={() => { [50, 25, 75, 100, 30, 20, 40, 60, 80, 90].forEach(k => insert(k)); }}
                className="w-full px-3 py-2 rounded text-sm transition-colors hover-overlay"
                style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
              >
                Load Sample Data
              </button>
              <button
                onClick={() => { setRoot(createNode(true)); setOperationHistory([]); setSearchResult(null); }}
                className="w-full px-3 py-2 rounded text-sm transition-colors hover-overlay"
                style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
              >
                Clear Tree
              </button>
            </div>
          </div>

          {/* Operation History */}
          {operationHistory.length > 0 && (
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                Operation History
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {operationHistory.map((op, i) => (
                  <div key={i} className="text-xs p-2 rounded" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                    {op}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--grid-line)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>Self-Balancing</h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            B-Trees automatically rebalance on insert/delete, guaranteeing O(log n) operations.
          </p>
        </div>

        <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--grid-line)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>Disk Optimized</h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Node size matches disk pages, minimizing I/O by reading/writing large chunks.
          </p>
        </div>

        <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--grid-line)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-coral)' }}>Range Queries</h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            In-order traversal provides efficient range queries and sorted access.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: 'var(--grid-line)' }}>
        <a
          href="/"
          className="font-medium hover-overlay"
          style={{ color: 'var(--accent-coral)' }}
        >
          ← Back to Home
        </a>
        <a
          href="/chapters/wal"
          className="px-6 py-3 text-white rounded-lg font-medium transition-colors hover-overlay"
          style={{ background: 'var(--accent-coral)' }}
        >
          Next: Write-Ahead Logging →
        </a>
      </div>
    </div>
  );
}

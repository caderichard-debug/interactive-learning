'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

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
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [demoPaused, setDemoPaused] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [searchPath, setSearchPath] = useState<string[]>([]);

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
    const visitedNodes: string[] = [];

    const searchHelper = (node: BTreeNode, key: number, path: string = 'root'): boolean => {
      visitedNodes.push(path);
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

      return searchHelper(node.children[i], key, `${path}-${i}`);
    };

    const found = searchHelper(root, key);
    setSearchPath(visitedNodes);
    setActiveNodes(new Set(visitedNodes));

    setTimeout(() => {
      setActiveNodes(new Set());
      setSearchPath([]);
    }, 2000);

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

  // Demo sequence for autoplay
  const demoSequence = [
    { type: 'insert', key: 50, description: 'Insert key 50' },
    { type: 'insert', key: 25, description: 'Insert key 25' },
    { type: 'insert', key: 75, description: 'Insert key 75' },
    { type: 'insert', key: 10, description: 'Insert key 10' },
    { type: 'insert', key: 30, description: 'Insert key 30' },
    { type: 'search', key: 25, description: 'Search for key 25' },
    { type: 'insert', key: 100, description: 'Insert key 100 (causes split)' },
    { type: 'delete', key: 10, description: 'Delete key 10' },
    { type: 'insert', key: 85, description: 'Insert key 85' },
    { type: 'search', key: 100, description: 'Search for key 100' },
    { type: 'insert', key: 95, description: 'Insert key 95' },
    { type: 'delete', key: 50, description: 'Delete key 50' }
  ];

  const runDemoStep = useCallback((stepIndex: number) => {
    if (stepIndex >= demoSequence.length) {
      setOperationHistory(prev => [...prev, '✨ Demo Complete! Watch it again or explore the tree manually.']);
      setIsAutoplay(false);
      setCurrentDemoStep(0);
      return;
    }

    const step = demoSequence[stepIndex];
    setOperationHistory(prev => [...prev, `Demo Step ${stepIndex + 1}/${demoSequence.length}: ${step.description}`]);

    switch (step.type) {
      case 'insert':
        insert(step.key);
        break;
      case 'search':
        search(step.key);
        break;
      case 'delete':
        removeKey(step.key);
        break;
    }

    setCurrentDemoStep(stepIndex + 1);
  }, [insert, search, removeKey]);

  // Use useEffect to handle autoplay timing
  useEffect(() => {
    if (isAutoplay && !demoPaused && currentDemoStep < demoSequence.length) {
      autoplayTimerRef.current = setTimeout(() => {
        runDemoStep(currentDemoStep);
      }, animationSpeed);
    } else if (currentDemoStep >= demoSequence.length && isAutoplay) {
      setIsAutoplay(false);
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [isAutoplay, demoPaused, currentDemoStep, runDemoStep, animationSpeed]);

  const startAutoplay = () => {
    setIsAutoplay(true);
    setCurrentDemoStep(0);
    setDemoPaused(false);
    setRoot(createNode(true));
    setOperationHistory(['Starting B-Tree Demo Animation...']);
  };

  const pauseAutoplay = () => {
    setDemoPaused(true);
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
    }
  };

  const resumeAutoplay = () => {
    setDemoPaused(false);
  };

  const stopAutoplay = () => {
    setIsAutoplay(false);
    setDemoPaused(false);
    setCurrentDemoStep(0);
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
    }
  };

  const replayDemo = () => {
    stopAutoplay();
    setTimeout(() => {
      startAutoplay();
    }, 100);
  };

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

  const renderNode = (node: BTreeNode, x: number, y: number, path: string = 'root', depth: number = 0) => {
    const nodeWidth = 160;
    const nodeHeight = 54;
    const keyWidth = 32;
    const totalWidth = Math.max(nodeWidth, node.keys.length * keyWidth + 24);

    const nodeKey = `${node.keys.join('-')}-${path}`;
    const isHovered = hoveredNode?.keys === nodeKey;
    const isClicked = clickedNode?.keys === nodeKey;
    const isActive = activeNodes.has(path);
    const isInSearchPath = searchPath.includes(path);

    // Dynamic colors based on state
    const nodeFill = isClicked ? '#1a1918' : isHovered ? '#1a1918' : '#21201e';
    const nodeStroke = isClicked ? '#e07060' : isActive ? '#e07060' : isInSearchPath ? '#10b981' : '#333333';
    const nodeStrokeWidth = isClicked ? 3 : isActive ? 2 : isInSearchPath ? 2 : 2;
    const nodeOpacity = isActive ? 1 : isInSearchPath ? 0.9 : 0.85;

    // Add glow effect for active nodes
    const glowColor = isActive ? '#e07060' : isInSearchPath ? '#10b981' : 'transparent';
    const glowOpacity = isActive ? 0.3 : isInSearchPath ? 0.2 : 0;

    return (
      <g key={nodeKey}>
        {/* Glow effect */}
        {(isActive || isInSearchPath) && (
          <>
            <ellipse
              cx={x}
              cy={y + nodeHeight / 2}
              rx={totalWidth / 2 + 8}
              ry={nodeHeight / 2 + 8}
              fill={glowColor}
              opacity={glowOpacity}
              style={{
                filter: 'blur(8px)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </>
        )}

        {/* Connection lines with gradient */}
        {!node.isLeaf && node.children.length > 0 && (
          <>
            {node.children.map((child, i) => {
              const childX = x + (i - node.children.length / 2 + 0.5) * 200;
              const childY = y + 110;
              const childPath = `${path}-${i}`;
              const isChildActive = activeNodes.has(childPath);
              const isChildInPath = searchPath.includes(childPath);

              return (
                <g key={i}>
                  {/* Connection line with gradient */}
                  <defs>
                    <linearGradient id={`line-gradient-${path}-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={isChildActive || isChildInPath ? '#e07060' : '#333333'} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={isChildActive || isChildInPath ? '#e07060' : '#333333'} stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <line
                    x1={x}
                    y1={y + nodeHeight}
                    x2={childX}
                    y2={childY}
                    stroke={`url(#line-gradient-${path}-${i})`}
                    strokeWidth={isChildActive || isChildInPath ? 2 : 1.5}
                    style={{
                      strokeDasharray: isChildActive || isChildInPath ? 'none' : '4,4',
                      animation: isChildActive || isChildInPath ? 'none' : 'dash 20s linear infinite'
                    }}
                  />
                  {renderNode(child, childX, childY, childPath, depth + 1)}
                </g>
              );
            })}
          </>
        )}

        {/* Node box with gradient */}
        <defs>
          <linearGradient id={`node-gradient-${nodeKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={nodeFill} stopOpacity={nodeOpacity} />
            <stop offset="100%" stopColor={nodeFill} stopOpacity={nodeOpacity * 0.9} />
          </linearGradient>
          <filter id={`shadow-${nodeKey}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity={0.3} />
          </filter>
        </defs>

        {/* Main node rectangle */}
        <rect
          x={x - totalWidth / 2}
          y={y}
          width={totalWidth}
          height={nodeHeight}
          fill={`url(#node-gradient-${nodeKey})`}
          stroke={nodeStroke}
          strokeWidth={nodeStrokeWidth}
          className="cursor-pointer hover-overlay"
          onClick={() => handleNodeClick(nodeKey, path)}
          onMouseEnter={() => setHoveredNode({ keys: nodeKey, path })}
          onMouseLeave={() => setHoveredNode(null)}
          rx="6"
          filter={`url(#shadow-${nodeKey})`}
          style={{
            transition: 'all 0.2s ease'
          }}
        />

        {/* Inner border for highlight */}
        {(isClicked || isActive) && (
          <rect
            x={x - totalWidth / 2 + 2}
            y={y + 2}
            width={totalWidth - 4}
            height={nodeHeight - 4}
            fill="none"
            stroke={isClicked ? '#e07060' : '#e07060'}
            strokeWidth="1"
            strokeOpacity="0.3"
            rx="4"
          />
        )}

        {/* Keys with better styling */}
        {node.keys.map((key, i) => (
          <g key={i}>
            {/* Key background */}
            <rect
              x={x - totalWidth / 2 + 10 + i * keyWidth - 2}
              y={y + 14}
              width={keyWidth - 4}
              height={24}
              fill={isActive ? '#e07060' : isInSearchPath ? '#10b981' : '#1a1918'}
              opacity={0.15}
              rx="3"
            />
            {/* Key text */}
            <text
              x={x - totalWidth / 2 + 10 + i * keyWidth}
              y={y + 31}
              fontSize="13"
              fontWeight="600"
              fill={isActive ? '#e07060' : isInSearchPath ? '#10b981' : '#e7e5e2'}
              className="pointer-events-none"
              style={{
                fontFamily: 'var(--font-mono)',
                textShadow: isActive ? '0 0 10px rgba(224, 112, 96, 0.5)' : 'none'
              }}
            >
              {key}
            </text>
          </g>
        ))}

        {/* Node type indicator */}
        {node.isLeaf && (
          <circle
            cx={x - totalWidth / 2 + 8}
            cy={y + 8}
            r="3"
            fill="#10b981"
            opacity="0.6"
          />
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
          <div className="overflow-auto mb-6 rounded-lg" style={{
            maxHeight: '650px',
            background: 'linear-gradient(135deg, #1a1918 0%, #21201e 100%)',
            border: '1px solid #333333'
          }}>
            <style jsx>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.05); }
              }
              @keyframes dash {
                to { stroke-dashoffset: -100; }
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes glow {
                0%, 100% { filter: drop-shadow(0 0 5px rgba(224, 112, 96, 0.5)); }
                50% { filter: drop-shadow(0 0 15px rgba(224, 112, 96, 0.8)); }
              }
            `}</style>
            <svg viewBox="-450 0 900 650" className="w-full" style={{
              minHeight: '550px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
            }}>
              <defs>
                {/* Background grid pattern */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333333" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
                {/* Gradient for background */}
                <radialGradient id="bg-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1a1918" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#21201e" stopOpacity="0"/>
                </radialGradient>
              </defs>

              {/* Background */}
              <rect width="100%" height="100%" fill="url(#bg-gradient)" opacity="0.5"/>
              <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3"/>

              {renderNode(root, 0, 50)}
            </svg>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="absolute bottom-4 left-4 right-4 p-5 rounded-lg backdrop-blur-md border-2 z-20" style={{
              background: 'rgba(26, 25, 24, 0.95)',
              borderColor: 'var(--accent-coral)',
              boxShadow: '0 8px 32px rgba(224, 112, 96, 0.3)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--accent-coral)' }}>
                    <span>🔍</span>
                    Search Result
                  </h4>
                  <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {searchResult}
                  </p>
                </div>
                <button
                  onClick={() => setSearchResult(null)}
                  className="font-bold text-xl leading-none hover-overlay ml-4 p-1 rounded transition-all"
                  style={{ color: 'var(--accent-coral)' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Clicked Node Info */}
          {clickedNode && (
            <div className="absolute bottom-4 left-4 right-4 p-5 rounded-lg backdrop-blur-md border-2 z-20" style={{
              background: 'rgba(26, 25, 24, 0.95)',
              borderColor: 'var(--accent-coral)',
              boxShadow: '0 8px 32px rgba(224, 112, 96, 0.3)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--accent-coral)' }}>
                    <span>🔗</span>
                    {getNodeInfo(clickedNode).title}
                  </h4>
                  <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {getNodeInfo(clickedNode).content}
                  </p>
                </div>
                <button
                  onClick={() => setClickedNode(null)}
                  className="font-bold text-xl leading-none hover-overlay ml-4 p-1 rounded transition-all"
                  style={{ color: 'var(--accent-coral)' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="p-6 rounded-xl shadow-lg" style={{
          background: 'var(--surface)',
          border: '1px solid #333333',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: '#e07060' }}>⚙️</span>
            Controls
          </h3>

          {/* Insert */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: '#10b981' }}>+</span>
              Insert Key (0-999)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="999"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="flex-1 px-3 py-2 rounded border transition-all"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--grid-line)',
                  fontFamily: 'var(--font-mono)',
                  borderWidth: '1px'
                }}
                placeholder="Enter key..."
                onKeyPress={(e) => e.key === 'Enter' && handleInsert()}
              />
              <button
                onClick={handleInsert}
                className="px-4 py-2 rounded font-medium transition-all hover-overlay text-white"
                style={{
                  background: 'var(--accent-coral)',
                  boxShadow: '0 4px 6px rgba(224, 112, 96, 0.3)'
                }}
              >
                Insert
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: '#8b5cf6' }}>🔍</span>
              Search Key
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="flex-1 px-3 py-2 rounded border transition-all"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--grid-line)',
                  fontFamily: 'var(--font-mono)',
                  borderWidth: '1px'
                }}
                placeholder="Enter key..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded font-medium transition-all hover-overlay text-white"
                style={{
                  background: 'var(--accent-coral)',
                  boxShadow: '0 4px 6px rgba(224, 112, 96, 0.3)'
                }}
              >
                Search
              </button>
            </div>
          </div>

          {/* Delete */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: '#ef4444' }}>−</span>
              Delete Key
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={deleteKey}
                onChange={(e) => setDeleteKey(e.target.value)}
                className="flex-1 px-3 py-2 rounded border transition-all"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--grid-line)',
                  fontFamily: 'var(--font-mono)',
                  borderWidth: '1px'
                }}
                placeholder="Enter key..."
                onKeyPress={(e) => e.key === 'Enter' && handleDelete()}
              />
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded font-medium transition-all hover-overlay text-white"
                style={{
                  background: 'var(--danger)',
                  boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)'
                }}
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
                className="w-full px-3 py-2 rounded text-sm transition-all hover-overlay"
                style={{
                  background: 'var(--surface-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid #333333'
                }}
              >
                📊 Load Sample Data
              </button>
              <button
                onClick={() => { setRoot(createNode(true)); setOperationHistory([]); setSearchResult(null); setIsAutoplay(false); }}
                className="w-full px-3 py-2 rounded text-sm transition-all hover-overlay"
                style={{
                  background: 'var(--surface-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid #333333'
                }}
              >
                🗑️ Clear Tree
              </button>
              <div className="pt-4 pb-2 border-t" style={{ borderColor: 'var(--grid-line)' }}>
                <label className="block text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--accent-coral)' }}>
                  🎬 Demo Animation
                </label>
                <div className="flex gap-2 mb-3">
                  {!isAutoplay ? (
                    <button
                      onClick={startAutoplay}
                      className="flex-1 px-3 py-2 rounded text-sm transition-all hover-overlay text-white"
                      style={{
                        background: 'var(--accent-coral)',
                        boxShadow: '0 4px 6px rgba(224, 112, 96, 0.3)',
                        fontWeight: '600'
                      }}
                    >
                      ▶ Play Demo
                    </button>
                  ) : (
                    <>
                      {demoPaused ? (
                        <button
                          onClick={resumeAutoplay}
                          className="flex-1 px-3 py-2 rounded text-sm transition-all hover-overlay text-white"
                          style={{
                            background: 'var(--accent-coral)',
                            boxShadow: '0 4px 6px rgba(224, 112, 96, 0.3)'
                          }}
                        >
                          ▶ Resume
                        </button>
                      ) : (
                        <button
                          onClick={pauseAutoplay}
                          className="flex-1 px-3 py-2 rounded text-sm transition-all hover-overlay text-white"
                          style={{
                            background: 'var(--warning)',
                            boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          ⏸ Pause
                        </button>
                      )}
                      <button
                        onClick={stopAutoplay}
                        className="flex-1 px-3 py-2 rounded text-sm transition-all hover-overlay text-white"
                        style={{
                          background: 'var(--danger)',
                          boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        ⏹ Stop
                      </button>
                    </>
                  )}
                </div>
                {isAutoplay && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={replayDemo}
                      className="flex-1 px-3 py-2 rounded text-sm transition-all hover-overlay"
                      style={{
                        background: 'var(--surface-elevated)',
                        color: 'var(--text-secondary)',
                        border: '1px solid #333333'
                      }}
                    >
                      ↺ Replay
                    </button>
                  </div>
                )}
                <div className="text-center py-2 px-3 rounded" style={{
                  background: isAutoplay ? 'rgba(224, 112, 96, 0.1)' : 'transparent',
                  border: isAutoplay ? '1px solid #e07060' : '1px solid #333333'
                }}>
                  <div className="text-sm font-semibold" style={{ color: isAutoplay ? '#e07060' : 'var(--text-secondary)' }}>
                    {isAutoplay ? `▶ Step ${currentDemoStep}/${demoSequence.length}` : '▶️ Ready to play'}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {isAutoplay ? 'Animation in progress...' : 'Watch B-Tree operations automatically'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operation History */}
          {operationHistory.length > 0 && (
            <div className="p-4 rounded-lg" style={{
              background: 'var(--surface-elevated)',
              border: '1px solid #333333',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#e07060' }}>📜</span>
                Operation History
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#333333 transparent'
              }}>
                {operationHistory.slice().reverse().map((op, i) => {
                  const isDemoStep = op.includes('Demo Step');
                  const isComplete = op.includes('✨');
                  const isInsert = op.toLowerCase().includes('insert');
                  const isSearch = op.toLowerCase().includes('search');
                  const isDelete = op.toLowerCase().includes('delete');
                  const isSplit = op.toLowerCase().includes('split');

                  let icon = '→';
                  let color = '#888888';

                  if (isDemoStep) { icon = '▶'; color = '#e07060'; }
                  else if (isComplete) { icon = '✨'; color = '#10b981'; }
                  else if (isInsert) { icon = '+'; color = '#10b981'; }
                  else if (isSearch) { icon = '🔍'; color = '#8b5cf6'; }
                  else if (isDelete) { icon = '−'; color = '#ef4444'; }
                  else if (isSplit) { icon = '⚡'; color = '#f59e0b'; }

                  return (
                    <div
                      key={operationHistory.length - 1 - i}
                      className="text-xs p-2 rounded transition-all"
                      style={{
                        background: isDemoStep || isComplete ? 'rgba(224, 112, 96, 0.1)' : 'var(--bg)',
                        color: color,
                        borderLeft: isDemoStep || isComplete ? '2px solid #e07060' : '2px solid transparent',
                        animation: 'fadeIn 0.3s ease-out',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px'
                      }}
                    >
                      <span style={{ minWidth: '16px' }}>{icon}</span>
                      <span style={{ flex: 1, color: isDemoStep || isComplete ? '#e7e5e2' : 'var(--text-secondary)' }}>
                        {op}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          {
            title: 'Self-Balancing',
            icon: '⚖️',
            color: '#e07060',
            description: 'B-Trees automatically rebalance on insert/delete, guaranteeing O(log n) operations.'
          },
          {
            title: 'Disk Optimized',
            icon: '💾',
            color: '#10b981',
            description: 'Node size matches disk pages, minimizing I/O by reading/writing large chunks.'
          },
          {
            title: 'Range Queries',
            icon: '📊',
            color: '#8b5cf6',
            description: 'In-order traversal provides efficient range queries and sorted access.'
          }
        ].map((concept, index) => (
          <div
            key={index}
            className="p-6 rounded-lg border-2 transition-all hover:scale-105"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: concept.color,
              boxShadow: `0 4px 12px rgba(${concept.color === '#e07060' ? '224, 112, 96' : concept.color === '#10b981' ? '16, 185, 129' : '139, 92, 246'}, 0.2)`,
              cursor: 'default'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{concept.icon}</span>
              <h4 className="font-semibold" style={{ color: concept.color, fontSize: '1.1rem' }}>
                {concept.title}
              </h4>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {concept.description}
            </p>
          </div>
        ))}
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

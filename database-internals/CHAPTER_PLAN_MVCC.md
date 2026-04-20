# MVCC Chapter - Implementation Plan

## Overview
Interactive visualization of Multi-Version Concurrency Control, showing how databases handle concurrent transactions without locking through versioning.

## Learning Objectives
- Understand how MVCC enables concurrent reads and writes
- Visualize transaction isolation levels
- See how version chains work
- Learn about MVCC storage overhead
- Compare MVCC vs traditional locking

## Interactive Components

### 1. Transaction Timeline Visualization
- **Multi-transaction timeline**: Show 3-4 concurrent transactions
  - Each transaction has its own horizontal track
  - Show start time, operations, commit/rollback
  - Highlight conflicts and dependencies
- **Time slider**: Scrub through timeline to see state at any point
- **Transaction control**: Start, commit, rollback individual transactions

### 2. Version Chain Visualization
- **Data row versions**: Show how a single row has multiple versions
  - Each version shows: xmin, xmax, transaction state
  - Visual representation of version chain (linked list)
  - Click version to see full metadata
- **Visibility rules**: Interactive explanation of who sees which version
  - Current transaction's snapshot
  - Committed vs uncommitted versions
  - Dead tuple identification

### 3. Isolation Level Simulator
- **Toggle isolation levels**: Read Committed, Repeatable Read, Serializable
- **Scenario runner**: Pre-built conflict scenarios
  - Lost update
  - Dirty read
  - Non-repeatable read
  - Phantom read
- **Interactive execution**: Step through scenarios to see behavior
- **Visualization**: Show which versions are visible at each step

### 4. Storage Impact Visualizer
- **Table bloat simulation**: Show how MVCC increases storage
  - Before and after many updates
  - VACUUM process visualization
- **Dead space indicator**: Show percentage of dead tuples
- **Autovacuum simulation**: Watch cleanup happen

## Technical Implementation

### Data Structure
```typescript
interface TupleVersion {
  xmin: number;        // Creator transaction ID
  xmax: number;        // Deleter transaction ID (0 if current)
  data: Record<string, any>;
  transactionState: 'active' | 'committed' | 'aborted';
  createdAt: number;
}

interface Transaction {
  id: number;
  startTime: number;
  state: 'active' | 'committed' | 'aborted';
  snapshot: Set<number>;  // Visible transaction IDs
  operations: Operation[];
}

interface Row {
  id: number;
  versions: TupleVersion[];
}
```

### Scenario Library
```typescript
const scenarios = {
  dirtyRead: {
    description: "Transaction B reads uncommitted data from A",
    setup: async () => {
      // Transaction A: UPDATE balance = 100
      // Transaction B: SELECT balance (sees 100)
      // Transaction A: ROLLBACK
    }
  },
  nonRepeatableRead: {
    description: "Transaction B sees different values on re-read",
    setup: async () => {
      // Transaction A: BEGIN, SELECT balance (= 50)
      // Transaction B: UPDATE balance = 100, COMMIT
      // Transaction A: SELECT balance (= 100)
    }
  },
  phantomRead: {
    description: "New rows appear in subsequent reads",
    setup: async () => {
      // Transaction A: BEGIN, SELECT * WHERE status = 'active'
      // Transaction B: INSERT new row with status = 'active', COMMIT
      // Transaction A: SELECT * WHERE status = 'active'
    }
  }
};
```

### Interactive Features
1. **Transaction state inspector**: Click any transaction to see its snapshot
2. **Version explorer**: Navigate through version chains
3. **Conflict detector**: Highlight potential race conditions
4. **Snapshot viewer**: Show what each transaction sees

## Visual Layout
```
┌─────────────────────────────────────────────────────────┐
│ Concurrent Transactions (Timeline View)                 │
│                                                         │
│ TX1 |─────UPDATE─────|COMMIT|                          │
│ TX2 |───────SELECT────────|                            │
│ TX3 |─────────INSERT──────|COMMIT|                     │
│     ↑                                                  │
│     Current Time Position                              │
└─────────────────────────────────────────────────────────┘

┌───────────────────────┬─────────────────────────────────┐
│ Row Version Chain     │ Transaction States             │
│                       │                                 │
│ Version 3 (current)   │ TX1: COMMITTED ✓               │
│ xmin: 102, xmax: 0    │ TX2: ACTIVE ⟳                   │
│ Data: balance=100     │ TX3: COMMITTED ✓               │
│         ↓             │ TX4: ABORTED ✗                  │
│ Version 2 (dead)      │                                 │
│ xmin: 98, xmax: 102   │ Snapshot (TX2):                │
│ Data: balance=50      │ • Sees TX1 changes ✓            │
│         ↓             │ • Sees TX3 changes ✓            │
│ Version 1 (dead)      │ • Ignores uncommitted           │
│ xmin: 95, xmax: 98    │                                 │
│ Data: balance=25      │                                 │
└───────────────────────┴─────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Isolation Level: [Read Committed ▼]                     │
│                                                         │
│ [▶ Run Scenario: Non-Repeatable Read]                   │
│                                                         │
│ Step 1/3: TX1 begins, reads balance = 50                │
│ Step 2/3: TX2 updates balance = 100, commits            │
│ Step 3/3: TX1 re-reads balance...                       │
│                                                         │
│ Result: Sees 100 (non-repeatable read!)                 │
└─────────────────────────────────────────────────────────┘
```

## Key Concepts to Explain
1. **Snapshots**: How each transaction sees consistent data
2. **Version Chains**: Link old versions together
3. **Visibility Rules**: When is a version visible?
4. **Isolation Levels**: What's prohibited at each level
5. **VACUUM**: Cleaning up dead versions

## Scenarios to Demonstrate
1. **Read Committed**: Each statement sees latest committed
2. **Repeatable Read**: First snapshot persists for entire transaction
3. **Serializable**: Detects serialization anomalies
4. **Write Skew**: Two transactions interdependent updates

## User Flow
1. User selects an isolation level
2. User starts 2-3 transactions
3. User performs operations (SELECT, UPDATE, INSERT)
4. User watches version chains grow
5. User commits/rolls back transactions
6. User sees which versions become visible/dead
7. User runs VACUUM to clean up
8. User tries different isolation levels

## Storage Visualization
- **Table size meter**: Shows growth with updates
- **Dead space indicator**: Percentage of wasted space
- **Vacuum progress**: Watch cleanup in action
- **Performance impact**: Show query slowdown with bloat

## Accessibility Considerations
- Color-blind friendly version indicators
- Keyboard navigation for timeline
- Screen reader announcements for state changes
- High contrast mode for version visibility

## Success Metrics
- Users understand why MVCC avoids locks
- Users can predict isolation level behavior
- Users recognize when VACUUM is needed
- Clear understanding of version chains

# Query Planning Chapter - Implementation Plan

## Overview
Interactive visualization of how database query planners optimize and execute SQL queries, showing EXPLAIN ANALYZE output with step-by-step execution.

## Learning Objectives
- Understand how databases parse and optimize queries
- See the difference between different join algorithms
- Visualize query execution plans
- Learn about query cost estimation
- Compare sequential scan vs index scan

## Interactive Components

### 1. Query Builder Interface
- **SQL Query Editor**: Simple text area for entering SELECT queries
- **Schema Visualization**: Show available tables (users, orders, products)
- **Query Templates**: Pre-built queries demonstrating different concepts
  - Simple SELECT with WHERE clause
  - JOIN queries (inner, left, right)
  - Aggregation queries
  - Subqueries

### 2. Query Plan Visualization
- **Plan Tree**: Interactive tree showing execution steps
  - Each node represents an operation (Seq Scan, Index Scan, Hash Join, etc.)
  - Click on nodes to see detailed stats
- **Cost Breakdown**: Show estimated vs actual costs
  - Startup cost
  - Total cost
  - Rows returned
  - Width/size

### 3. Join Algorithm Comparison
- **Interactive comparison**: Same query with different join methods
  - Nested Loop Join
  - Hash Join
  - Merge Join
- **Performance visualization**: Bar charts showing time/rows
- **When to use which**: Explanations of data size thresholds

### 4. Scan Type Comparison
- **Sequential Scan vs Index Scan**: Toggle between methods
- **Visual representation**: Show how each scans the table
- **Selectivity analysis**: Show how WHERE clause affects choice

## Technical Implementation

### Data Structure
```typescript
interface QueryPlanNode {
  type: 'Seq Scan' | 'Index Scan' | 'Hash Join' | 'Nested Loop' | 'Sort' | 'Aggregate';
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
```

### Schema Design
```typescript
const schema = {
  users: {
    columns: [
      { name: 'id', type: 'integer', indexed: true },
      { name: 'name', type: 'text', indexed: false },
      { name: 'email', type: 'text', indexed: true },
      { name: 'created_at', type: 'timestamp', indexed: false }
    ],
    rowCount: 10000
  },
  orders: {
    columns: [
      { name: 'id', type: 'integer', indexed: true },
      { name: 'user_id', type: 'integer', indexed: true },
      { name: 'total', type: 'decimal', indexed: false },
      { name: 'status', type: 'text', indexed: true }
    ],
    rowCount: 50000
  }
};
```

### Interactive Features
1. **Real-time plan updates**: As query changes, plan updates
2. **Step-by-step execution**: Click "Next Step" to walk through plan
3. **Cost calculation slider**: Adjust row count estimates to see plan changes
4. **Index toggle**: Add/remove indexes to see plan changes

## Visual Layout
```
┌─────────────────────────────────────────────────────────┐
│ Query Editor                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ SELECT * FROM users WHERE email = 'user@example.com'│ │
│ └─────────────────────────────────────────────────────┘ │
│ [Run Query] [Explain] [Analyze]                         │
└─────────────────────────────────────────────────────────┘

┌───────────────────────┬─────────────────────────────────┐
│ Execution Plan Tree   │ Query Statistics                │
│                       │                                 │
│   Hash Join           │ Planning Time: 0.5ms           │
│   ├─ Hash             │ Execution Time: 12.3ms         │
│   │  └─ Seq Scan      │ Rows Returned: 1               │
│   │     (orders)      │                                 │
│   └─ Index Scan       │ Cost Breakdown:                │
│      (users email)    │ • Seq Scan: 5.2                │
│                       │ • Hash: 3.1                    │
│                       │ • Index Scan: 2.0              │
└───────────────────────┴─────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Join Algorithm Comparison                               │
│                                                         │
│ Nested Loop: ████████████ 45ms                         │
│ Hash Join:   ██████ 12ms ✓ (Selected)                  │
│ Merge Join:  ██████████ 28ms                           │
└─────────────────────────────────────────────────────────┘
```

## Key Concepts to Explain
1. **Query Parsing**: How SQL becomes a parse tree
2. **Query Optimization**: Cost-based optimization
3. **Plan Caching**: When plans are reused
4. **Statistics**: How row estimates work
5. **Index Usage**: When indexes help vs hurt

## User Flow
1. User sees example queries and selects one
2. Query appears in editor
3. User clicks "Explain" to see execution plan
4. User clicks on plan nodes to see details
5. User modifies query or schema (add index)
6. Plan updates to show changes
7. User compares different join methods

## Accessibility Considerations
- Keyboard navigation for all interactive elements
- Screen reader support for plan tree
- High contrast mode support
- Text alternatives for visualizations

## Success Metrics
- Users understand why certain plans are chosen
- Users can identify when indexes would help
- Users understand cost estimation
- Reduced query troubleshooting time

# Query Planning Chapter - Detailed Page Layout

## Overall Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Header Section                                                      │
│ ├─ Title: "Query Planning & Optimization"                           │
│ ├─ Subtitle: "Understanding how databases execute your queries"    │
│ └─ Progress: Chapter 3/6                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Educational Content (Collapsible "What is Query Planning?")         │
│                                                                    │
│ Query planning is the process where the database optimizer decides  │
│ the most efficient way to execute a SQL query. It parses the SQL,  │
│ generates multiple possible plans, estimates costs, and chooses     │
│ the lowest-cost plan.                                              │
│                                                                    │
│ Key concepts: EXPLAIN, cost estimation, join algorithms, indexes   │
│                                                                    │
│ [Show More Details ▼]                                              │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────┬─────────────────────────────┐
│ Main Visualization Area (2/3 width)  │ Control Panel (1/3 width)   │
│                                       │                             │
│ ┌─────────────────────────────────┐ │ ┌─────────────────────────┐ │
│ │ SQL Query Editor                │ │ │ Query Templates         │ │
│ │ ┌─────────────────────────────┐│ │ │                         │ │
│ │ │SELECT u.name, o.total       ││ │ │ [Simple SELECT]         │ │
│ │ │FROM users u                 ││ │ │                         │ │
│ │ │JOIN orders o ON u.id =      ││ │ │ [Inner Join]            │ │
│ │ │     o.user_id               ││ │ │                         │ │
│ │ │WHERE o.status = 'complete'  ││ │ │ [Left Join]             │ │
│ │ │  AND o.total > 100          ││ │ │                         │ │
│ │ └─────────────────────────────┘│ │ │ [Aggregation]           │ │
│ │                                 │ │                         │ │
│ │ [▶ Run Query] [? Explain]      │ │ │ [Subquery]              │ │
│ │ [📊 Analyze]                   │ │ └─────────────────────────┘ │
│ └─────────────────────────────────┘ │                             │
│                                     │ ┌─────────────────────────┐ │
│ ┌─────────────────────────────────┐ │ │ Schema Browser          │ │
│ │ Execution Plan Tree             │ │ │                         │ │
│ │                                 │ │ │ 📁 users (10K rows)     │ │
│ │         HashJoin                │ │ │   • id (PK, indexed)    │ │
│ │        /        \                │ │ │   • email (indexed)     │ │
│ │      Hash        SeqScan        │ │ │   • name                │ │
│ │     /              (orders)     │ │ │                         │ │
│ │   IndexScan                      │ │ │ 📁 orders (50K rows)    │ │
│ │   (users)                        │ │ │   • id (PK, indexed)    │ │
│ │                                  │ │ │   • user_id (indexed)   │ │
│ │ Click nodes to see details →     │ │ │   • total               │ │
│ └─────────────────────────────────┘ │ │   • status (indexed)     │
│                                     │ └─────────────────────────┘ │
│ ┌─────────────────────────────────┐ │                             │
│ │ Cost Breakdown                  │ │ ┌─────────────────────────┐ │
│ │                                 │ │ │ Plan Controls           │ │
│ │ Total Cost: 45.23               │ │ │                         │ │
│ │ Startup:   0.05                 │ │ │ Row Count Estimate:     │ │
│ │ Rows:      1250                 │ │ │ [━━━●━━━━] 10K         │ │
│ │ Width:     32 bytes             │ │ │                         │ │
│ │                                 │ │ │ Buffer Size:            │ │
│ │ Cost Breakdown:                 │ │ │ [━━━●━━━━] 8MB         │ │
│ │ • HashJoin: 38.50               │ │ │                         │ │
│ │ • SeqScan:  5.20                │ │ │ Work Mem:               │ │
│ │ • Index:    1.53                │ │ │ [━●━━━━━] 4MB          │ │
│ └─────────────────────────────────┘ │ └─────────────────────────┘ │
│                                     │                             │
│ ┌─────────────────────────────────┐ │ ┌─────────────────────────┐ │
│ │ Join Comparison                 │ │ │ Index Toggle            │ │
│ │                                 │ │ │                         │ │
│ │ Hash Join   ████████ 12ms ✓    │ │ │ [✓] users.email         │ │
│ │ Nested Loop ████████████████ 45ms│ │                         │ │
│ │ Merge Join  ████████████ 28ms   │ │ │ [✓] orders.user_id      │ │
│ │                                 │ │ │                         │ │
│ │ Hash join selected for         │ │ │ [✓] orders.status       │ │
│ │ large dataset, no sort order   │ │ │                         │ │
│ └─────────────────────────────────┘ │ [+] Add Index             │ │
│                                     │ └─────────────────────────┘ │
└──────────────────────────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Node Detail Panel (appears when plan node clicked)                 │
│                                                                    │
│ HashJoin Details                                                   │
│ ─────────────────                                                  │
│ • Hash Cond: (users.id = orders.user_id)                          │
│ • Plan: Build hash from users, probe with orders                   │
│ • Buckets: 1024                                                    │
│ • Memory: 8MB                                                      │
│                                                                    │
│ Why this plan?                                                     │
│ → Tables are large (10K + 50K rows)                               │
│ → No useful sort order                                             │
│ → Equi-join condition (hash-friendly)                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Key Concepts Cards                                                  │
│                                                                    │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│ Cost Estimation  │  Join Algorithms │  Index Usage     │        │
│                 │  │                │  │                │        │
│ Databases use   │  Different joins  │  Indexes can     │        │
│ statistics to   │  excel at        │  dramatically   │        │
│ estimate row    │  different data  │  speed up        │        │
│ counts and I/O  │  sizes and       │  queries but     │        │
│ costs           │  conditions      │  add overhead    │        │
└────────────────┴────────────────┴────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Step-by-Step Execution Mode                                         │
│                                                                    │
│ [▶ Step Through Query Execution]                                   │
│                                                                    │
│ Step 3/8: Executing HashJoin                                       │
│ • Building hash table from users (10,000 rows)                     │
│ • Progress: [████████░░] 80%                                      │
│ • Current operation: Probing orders table                          │
│                                                                    │
│ [⏮ Previous] [⏸ Pause] [▶ Next]                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Footer Navigation                                                   │
│                                                                    │
│ [← Write-Ahead Logging]  [Chapter 3/6]  [Next: MVCC →]            │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### Query Editor Component
- **Size**: 600px wide, 150px tall
- **Features**: Syntax highlighting, line numbers, auto-indent
- **Buttons**: Run (coral), Explain (gray), Analyze (coral)
- **Position**: Top-left of main area

### Plan Tree Component
- **Size**: Full width of main area, 400px tall
- **Style**: Hierarchical tree with rounded rectangles
- **Interactivity**: Click to expand/collapse, hover for tooltip
- **Color coding**: Join (coral), Scan (cyan), Sort (violet), Aggregate (green)

### Cost Breakdown Component
- **Size**: 400px wide, 200px tall
- **Style**: Donut chart + text breakdown
- **Updates**: Real-time as query changes
- **Position**: Below plan tree

### Join Comparison Chart
- **Size**: 400px wide, 150px tall
- **Type**: Horizontal bar chart
- **Interactivity**: Click to switch algorithms
- **Animation**: Bars animate when values change

### Schema Browser
- **Size**: Full width of control panel
- **Style**: Expandable folder tree
- **Interactivity**: Click table to show columns, click column to see stats

## Responsive Layout
- **Desktop (>1024px)**: Side-by-side layout as shown
- **Tablet (768-1024px)**: Control panel moves below visualization
- **Mobile (<768px)**: Single column, collapsible controls

## Color Scheme
- **Coral (#e07060)**: Primary actions, selected items
- **Cyan (#5ba3b5)**: Scan operations
- **Violet (#8b7aa8)**: Sort operations
- **Green (#5a9a6e)**: Aggregate operations
- **Background**: #21201e (dark), #1a1918 (elevated)
- **Text**: #e7e5e2 (primary), #888888 (secondary)

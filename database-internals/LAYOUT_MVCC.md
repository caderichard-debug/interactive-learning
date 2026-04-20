# MVCC Chapter - Detailed Page Layout

## Overall Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Header Section                                                      │
│ ├─ Title: "Multi-Version Concurrency Control (MVCC)"               │
│ ├─ Subtitle: "How databases handle concurrent transactions"        │
│ └─ Progress: Chapter 4/6                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Educational Content (Collapsible "What is MVCC?")                  │
│                                                                    │
│ MVCC allows multiple transactions to access the database           │
│ concurrently without blocking by maintaining multiple versions     │
│ of each row. Readers don't block writers, and writers don't       │
│ block readers.                                                     │
│                                                                    │
│ Key concepts: Transaction IDs, snapshots, version chains,          │
│ isolation levels, VACUUM                                           │
│                                                                    │
│ [Show More Details ▼]                                              │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────┬─────────────────────────────┐
│ Main Visualization Area (2/3 width)  │ Control Panel (1/3 width)   │
│                                       │                             │
│ ┌─────────────────────────────────┐ │ ┌─────────────────────────┐ │
│ │ Transaction Timeline            │ │ │ Isolation Level         │ │
│ │                                 │ │ │                         │ │
│ │ TX1 │██████████████████│COMMIT│ │ │ [Read Committed     ▼]  │ │
│ │     ↑UPDATE users SET...       │ │ │                         │ │
│ │                                 │ │ • Each statement sees    │ │
│ │ TX2 │██████████████████████████│ │ │   latest committed      │ │
│ │     ↑SELECT * FROM users...    │ │ │                         │ │
│ │                                 │ │ ┌─────────────────────┐ │ │
│ │ TX3 │███ABORT█│                │ │ │ Scenario Selector    │ │ │
│ │     ↑DELETE FROM users...      │ │ │                     │ │ │
│ │                                 │ │ │ [Dirty Read]         │ │ │
│ │ Current Time: ┃                 │ │ │ [Lost Update]       │ │ │
│ └─────────────────────────────────┘ │ │ [Non-Repeatable Read]│ │
│                                     │ │ [Phantom Read]       │ │ │
│ ┌─────────────────────────────────┐ │ │ [Write Skew]        │ │ │
│ │ Version Chain Visualization    │ │ └─────────────────────┘ │
│ │                                 │ │                         │
│ │ Row: users (id=1)              │ │ ┌─────────────────────┐ │
│ │                                 │ │ │ Transaction Controls │ │ │
│ │ ┌───────────────────────────┐  │ │ │                     │ │ │
│ │ │ Version 3 (CURRENT)       │  │ │ │ [BEGIN Transaction] │ │ │
│ │ │ xmin: 102  xmax: 0        │  │ │ │                     │ │ │
│ │ │ name: 'Alice'             │  │ │ │ [UPDATE users       │ │ │
│ │ │ email: 'alice@test.com'   │  │ │ │  SET name='Bob'     │ │ │
│ │ │ State: COMMITTED          │  │ │ │  WHERE id=1]        │ │ │
│ │ └───────────────────────────┘  │ │ │                     │ │ │
│ │           ↓                   │ │ │ [SELECT * FROM       │ │ │
│ │ ┌───────────────────────────┐  │ │ │  users WHERE id=1]   │ │ │
│ │ │ Version 2 (DEAD)          │  │ │ │                     │ │ │
│ │ │ xmin: 98   xmax: 102      │  │ │ │ [COMMIT]            │ │ │
│ │ │ name: 'Alice'             │  │ │ │ [ROLLBACK]          │ │ │
│ │ │ email: 'alice@old.com'    │  │ │ └─────────────────────┘ │
│ │ │ State: COMMITTED          │  │ │                         │
│ │ └───────────────────────────┘  │ │ ┌─────────────────────┐ │
│ │           ↓                   │ │ │ Snapshot Viewer      │ │ │
│ │ ┌───────────────────────────┐  │ │ │                     │ │ │
│ │ │ Version 1 (DEAD)          │  │ │ │ TX2 sees:            │ │ │
│ │ │ xmin: 95   xmax: 98       │  │ │ │ • TX1: VISIBLE ✓     │ │ │
│ │ │ name: 'Alice'             │  │ │ │ • TX3: INVISIBLE ✗   │ │ │
│ │ │ email: 'alice@xyz.com'    │  │ │ │                     │ │ │
│ │ │ State: COMMITTED          │  │ │ │ Snapshot ID:         │ │ │
│ │ └───────────────────────────┘  │ │ │ 102, 98, 95          │ │ │
│ │                                 │ │ └─────────────────────┘ │
│ │ Click version for details →     │ │                         │
│ └─────────────────────────────────┘ │ ┌─────────────────────┐ │
│                                     │ │ Database Stats      │ │
│ ┌─────────────────────────────────┐ │ │                     │ │ │
│ │ Visibility Rules               │ │ │ Active TX: 2        │ │
│ │                                 │ │ │ Dead Tuples: 15      │ │ │
│ │ Transaction can see version if: │ │ │ Table Size: 2.3MB    │ │ │
│ │                                 │ │ │ Bloat: 12%          │ │ │
│ │ ✓ xmin is committed            │ │ │                     │ │ │
│ │ ✓ xmax = 0 (not deleted)       │ │ │ [💾 Run VACUUM]      │ │ │
│ │ ✓ xmin < current_tx_id         │ │ │                     │ │ │
│ │ ✓ NOT (xmax in snapshot)       │ │ └─────────────────────┘ │
│ │                                 │ │                         │
│ │ [Learn More ↓]                 │ │ ┌─────────────────────┐ │
│ └─────────────────────────────────┘ │ │ Playback Speed       │ │
│                                     │ │                     │ │ │
│                                     │ │ [━━━●━━━━] 1x      │ │
│                                     │ └─────────────────────┘ │
└──────────────────────────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Scenario Execution Panel (appears when scenario selected)           │
│                                                                    │
│ Running: Non-Repeatable Read Scenario                              │
│ ──────────────────────────────────                                  │
│                                                                    │
│ Step 2/4: TX2 reads users table                                    │
│ ──────────────────────────────────                                  │
│ • TX1 has already committed                                        │
│ • TX2 sees the UPDATED value (name='Bob')                          │
│ • This demonstrates non-repeatable read!                           │
│                                                                    │
│ Expected in Read Committed: YES                                    │
│ Expected in Repeatable Read: NO                                    │
│                                                                    │
│ [⏮ Previous Step] [⏸ Pause] [▶ Next Step]                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Storage Impact Visualization                                         │
│                                                                    │
│ Table Growth Over Time                                              │
│                                                                    │
│ 100% │                                                            │
│  90% │                                                    ████     │
│  80% │                                          ████████    ████  │
│  70% │                                ██████████      ████      │
│  60% │                      █████████        ████      ████    │
│  50% │            █████████        ████            ████      ████│
│  40% │  ████████        ████      ████            ████      ████│
│  30% │  ████            ████      ████            ████      ████│
│      └──────────────────────────────────────────────────────────│
│        0    100   200   300   400   500   600   700   800      │
│                    Updates (thousands)                            │
│                                                                    │
│ Current: 750K updates | Dead tuples: 125K (17%) | Need VACUUM? YES │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Isolation Level Comparison                                           │
│                                                                    │
│ ┌────────────────────┐  ┌────────────────────┐  ┌────────────────┐│
│ Read Committed      │  Repeatable Read     │  Serializable    ││
│                    │  │                    │  │                ││
│ Dirty reads:       │  Dirty reads:        │  Dirty reads:    ││
│    NO ✓            │     NO ✓            │     NO ✓        ││
│                    │  │                    │  │                ││
│ Non-repeatable:    │  Non-repeatable:     │  Non-repeatable: ││
│    POSSIBLE ⚠      │     NO ✓            │     NO ✓        ││
│                    │  │                    │  │                ││
│ Phantoms:          │  Phantoms:           │  Phantoms:       ││
│    POSSIBLE ⚠      │     POSSIBLE ⚠      │     NO ✓         ││
│                    │  │                    │  │                ││
│ Performance:       │  Performance:        │  Performance:    ││
│    BEST ✓✓         │     GOOD ✓           │     SLOWER ⚠    ││
└────────────────────┴────────────────────┴────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Key Concepts Cards                                                  │
│                                                                    │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│ Transaction IDs │  Version Chains  │  Snapshots       │        │
│                 │  │                │  │                │        │
│ Each transaction │  Multiple        │  Point-in-time   │        │
│ gets a unique   │  versions of     │  view of data     │        │
│ ID (XID) when   │  each row are    │  seen by each     │        │
│ it begins        │  linked together │  transaction      │        │
└────────────────┴────────────────┴────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Footer Navigation                                                   │
│                                                                    │
│ [← Query Planning]  [Chapter 4/6]  [Next: Index Comparison →]      │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### Transaction Timeline Component
- **Size**: Full width of main area, 120px tall
- **Style**: Horizontal swimlane diagram
- **Features**:
  - Each transaction has its own lane
  - Vertical cursor shows current time position
  - Draggable to scrub through time
  - Hover shows operation details
- **Color coding**: Active (coral), Committed (green), Aborted (red)

### Version Chain Visualization
- **Size**: 400px wide, 300px tall
- **Style**: Vertical stack of version cards
- **Interactivity**: Click to expand, hover for metadata
- **Indicators**:
  - Border color: Current (coral), Dead (gray)
  - Icons: xmin/xmax values
  - Status badges: COMMITTED/ABORTED

### Scenario Selector
- **Size**: Full width of control panel
- **Style**: Dropdown with description
- **Options**: 5 pre-built scenarios
- **Info panel**: Shows what anomaly to expect

### Snapshot Viewer
- **Size**: Full width of control panel
- **Style**: List of visible transactions
- **Updates**: Real-time as timeline cursor moves
- **Color coding**: Visible (green), Invisible (gray)

### Storage Impact Graph
- **Size**: Full width, 200px tall
- **Type**: Line chart with annotations
- **X-axis**: Number of updates
- **Y-axis**: Table size percentage
- **Features**: Hover for details, VACUUM button appears when needed

## Interactive Features

### Timeline Scrubbing
- Drag vertical cursor to see database state at any point
- All visualizations update in real-time
- Shows what each transaction sees at that moment

### Scenario Execution
- Step-by-step playback of conflict scenarios
- Pause at each step to examine state
- Shows why anomaly occurs (or doesn't)

### Isolation Level Toggle
- Switch isolation levels and re-run scenarios
- See same scenario produce different results
- Understand trade-offs

### VACUUM Simulation
- Click "Run VACUUM" to clean up dead tuples
- Watch storage graph drop
- See version chains collapse

## Responsive Layout
- **Desktop**: Side-by-side layout
- **Tablet**: Control panel moves below
- **Mobile**: Single column, timeline becomes horizontal scroll

## Color Scheme
- **Transaction Active**: Coral (#e07060)
- **Transaction Committed**: Green (#5a9a6e)
- **Transaction Aborted**: Red (#c75a5a)
- **Version Current**: Coral border
- **Version Dead**: Gray border (#666666)
- **Visible in Snapshot**: Green checkmark
- **Invisible**: Gray X mark

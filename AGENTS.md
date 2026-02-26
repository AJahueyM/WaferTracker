# AGENTS.md — WaferTracker

> Guidelines and architecture documentation for AI agents working on this codebase.

---

## Project Overview

**WaferTracker** is a React + TypeScript (Vite) single-page application used to manage and track the quality of individual nodes on semiconductor wafers. Each wafer is modeled as a grid of nodes, and each node carries a quality classification that is visually represented as a color on an interactive grid.

### Key Capabilities

- **Wafer management** — Create, list, rename, and delete wafers.
- **Node quality tracking** — Each node on a wafer grid has a quality level (`excellent | good | fair | poor | fail | untested`) and optional notes.
- **Circular wafer grid** — Nodes are rendered in a circular disc layout (Euclidean distance masking); nodes outside the circle radius are hidden. Display labels are renumbered sequentially so the first visible node is always R0C0.
- **Interactive grid view** — Color-coded grid; clicking a node opens an edit modal with a quality slider.
- **Pluggable data layer** — All persistence is abstracted behind `IWaferDataSource`, making it trivial to swap storage backends.

---

## Tech Stack

| Layer        | Technology                  |
| ------------ | --------------------------- |
| Framework    | React 19 + TypeScript       |
| Build tool   | Vite 7                      |
| Styling      | Plain CSS (dark/grey theme) |
| Data storage | Abstract interface + cache  |

---

## Project Structure

```
src/
├── types/
│   └── index.ts              # Shared TypeScript types (Wafer, WaferNode, NodeQuality, etc.)
├── data/
│   ├── IWaferDataSource.ts   # Abstract data-source interface
│   ├── CacheDataSource.ts    # In-memory + localStorage implementation
│   └── index.ts              # Barrel exports
├── context/
│   └── DataSourceContext.tsx  # React context providing the active data source
├── utils/
│   └── quality.ts            # Quality-level color map, labels, ordered list
├── components/
│   ├── Sidebar.tsx / .css    # Wafer list sidebar with create form
│   ├── WaferGrid.tsx / .css  # Interactive color-coded node grid
│   └── NodeEditModal.tsx/.css# Modal for editing a node's quality and notes
├── App.tsx                   # Root component wiring everything together
├── main.tsx                  # Vite entry point
└── index.css                 # Global reset + dark theme base styles
```

---

## Architecture Decisions

### Data Abstraction Layer

All data operations flow through the `IWaferDataSource` interface (`src/data/IWaferDataSource.ts`). This cleanly separates the UI from persistence concerns.

```
UI Components → useDataSource() hook → IWaferDataSource (interface)
                                             │
                                     ┌───────┴───────┐
                                     │ CacheDataSource│  ← current implementation
                                     └───────┬───────┘
                                             │
                                  (future: REST API, SQLite, IndexedDB, etc.)
```

**To add a new storage backend:**

1. Create a new class implementing `IWaferDataSource`.
2. Pass it to `<DataSourceProvider dataSource={yourSource}>` in `App.tsx`.
3. No UI code needs to change.

### CacheDataSource Details

- Keeps all data in a `Map<string, Wafer>` in memory.
- Optionally mirrors to `localStorage` under key `wafertracker_data` (enabled by default via `persist: true`).
- All methods are `async` to match the interface contract (enables future network-based implementations without refactoring).
- `getWafer()` returns a **deep copy** (via `JSON.parse(JSON.stringify(...))`) so that React state comparisons detect changes after in-place mutations.

---

## Coding Conventions

- **TypeScript strict mode** — `strict: true` in tsconfig, no `any` types.
- **Named exports** — Prefer named exports over default exports (except `App` for Vite convention).
- **CSS modules not used** — Plain CSS files co-located with components. Class names are descriptive and scoped by component prefix.
- **No external UI library** — All icons are inline SVGs; no Material UI / Tailwind / etc.
- **Functional components only** — No class components.
- **Hooks** — `useCallback` and `useMemo` used for performance-critical paths (grid rendering, event handlers).

---

## Theming

The app uses a **dark grey color scheme**:

| Element          | Color   | Token         |
| ---------------- | ------- | ------------- |
| Background       | #0f0f13 | base bg       |
| Surface          | #1a1a1f | cards / grid  |
| Surface raised   | #1e1e24 | modals        |
| Border           | #2e2e35 | subtle border |
| Text primary     | #e4e4e7 | zinc-200      |
| Text secondary   | #a1a1aa | zinc-400      |
| Text muted       | #71717a | zinc-500      |
| Accent           | #818cf8 | indigo-400    |

### Quality Color Map

| Quality   | Color   |
| --------- | ------- |
| Excellent | #22c55e |
| Good      | #3b82f6 |
| Fair      | #eab308 |
| Poor      | #f97316 |
| Fail      | #ef4444 |
| Untested  | #52525b |

The `qualityLevels` array is ordered **untested → excellent** (worst to best). This order drives the quality slider in the edit modal and the gradient direction.

---

## Common Tasks

### Add a new field to wafer nodes

1. Add the field to the `WaferNode` type in `src/types/index.ts`.
2. Initialize it in `CacheDataSource.createWafer()`.
3. Expose it in `NodeEditModal` for editing.
4. (Optional) Reflect it visually in `WaferGrid`.

### Add a new data source (e.g., REST API)

1. Create `src/data/ApiDataSource.ts` implementing `IWaferDataSource`.
2. In `App.tsx`, instantiate it and pass to `<DataSourceProvider>`.
3. All existing components will work without modification.

### Change the grid node size or spacing

Edit the CSS variables in `src/components/WaferGrid.css`:
- `.wafer-node` width/height for cell size (currently **52px**).
- `.wafer-grid` gap for spacing.
- Update `gridTemplateColumns` in `WaferGrid.tsx` if the size value changes.

### Circular grid & display labels

- `WaferGrid.tsx` computes a Euclidean distance from each node to the grid center; nodes outside the radius are hidden (`wafer-node-hidden` class).
- Display labels (`R0C0`, `R0C1`, …) are renumbered sequentially over visible nodes only. Internal data IDs remain based on the full rectangular grid.
- Stats and node counts only include visible (in-circle) nodes.
- The circular container is `.wafer-disc` (CSS `border-radius: 50%`).

### Node edit modal

- Quality is selected via a **range slider** (not buttons). The slider maps indices to the `qualityLevels` array.
- The slider track has a gradient from grey (Untested) to green (Excellent), and the thumb color matches the selected quality.
- Notes are edited via a textarea.

---

## Running the Project

```bash
npm install
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build locally
```

---

## Notes for AI Agents

- Always run `npx tsc --noEmit` after making changes to verify type safety.
- When modifying the data layer, ensure both the interface and all implementations stay in sync.
- The `IWaferDataSource` contract uses `Promise` returns everywhere — never return synchronously even if the implementation is sync.
- localStorage data is keyed under `wafertracker_data`. Clear it to reset app state during development.
- Keep the dark theme consistent — reference the color tokens table above.

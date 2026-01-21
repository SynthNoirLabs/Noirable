# Layout Controls Design

**Goal:** Make the left JSON pane narrower by default and add toggles to hide/show the left (editor) and right (chat) panes without breaking the noir aesthetic.

**User Experience**
- Default layout uses a narrower editor pane and a stable chat width.
- Each side pane can be collapsed with a small icon button in its header.
- When collapsed, a thin “rail” button remains so the pane can be reopened.
- Layout preferences persist across reloads.

**Layout Rules**
- When both panes are visible: `grid-cols-[clamp(240px,22vw,320px)_1fr_clamp(320px,26vw,420px)]`.
- When only editor + preview: `grid-cols-[clamp(240px,22vw,320px)_1fr]`.
- When only preview + sidebar: `grid-cols-[1fr_clamp(320px,26vw,420px)]`.
- When both hidden: `grid-cols-1`.

**State & Persistence**
- Store layout state in `useA2UIStore`:
  - `layout.showEditor`, `layout.showSidebar`.
- Persist layout alongside settings using zustand `persist`.

**Components**
- `DeskLayout` receives `showEditor/showSidebar` and optional `onToggleEditor/onToggleSidebar`.
- Left header adds collapse button (e.g., chevron).
- `ChatSidebar` header adds collapse button near settings.
- Rails are shown when a pane is hidden.

**Testing**
- Unit tests validate layout grid classes based on state.
- Tests assert toggle buttons call callbacks.

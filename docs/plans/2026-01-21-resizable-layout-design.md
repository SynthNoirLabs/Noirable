# Resizable Layout Design

**Goal:** Make the editor and sidebar panes resizable via drag handles and persist their widths.

**UI Behavior**
- Add vertical resize handles between editor ↔ preview and preview ↔ sidebar.
- Dragging updates widths in real time; widths persist across reloads.
- Double-click handle resets to default width.
- When a pane is collapsed, its width is `0px` and only a rail button remains.

**Sizing Rules**
- Editor width clamp: 200–360px.
- Sidebar width clamp: 260–520px.
- Preview keeps remaining space, minimum 360px.
- Default widths match current clamp behavior.

**State**
Add to store:
- `layout.editorWidth`
- `layout.sidebarWidth`

**Implementation**
- Use CSS variables on `DeskLayout`: `--editor-w`, `--sidebar-w`.
- Grid template uses these variables.
- Drag handle uses pointer events + `requestAnimationFrame`.

**Testing**
- Unit test that inline styles reflect stored widths.
- Unit test that drag events update store.

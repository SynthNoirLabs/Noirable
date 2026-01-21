# Evidence Board Upgrades Design

**Goal:** Add an evidence history grid/list and print/export for the active evidence.

## Grid/List
- Store an `evidenceHistory` array with `{ id, createdAt, label, status, data }`.
- Provide view toggles (Grid/List) and sort (Latest/Oldest).
- Clicking an item focuses it (render full evidence in the board detail area).

## Print/Export
- Add a print view route `/print` that renders the active evidence.
- Provide a “Print” button in the board toolbar.
- Use `@media print` to simplify visuals.

## Data Model
- `activeEvidenceId` in store.
- Helpers to derive label + status from evidence data.

## Testing
- Unit tests for history additions and view toggles.
- Print view test to ensure evidence renders.

/**
 * Shared, preset-agnostic component decision guidance.
 *
 * Unlike the per-preset `layoutDoctrine` (which describes a signature
 * composition for each aesthetic), this playbook is structural advice that
 * applies to EVERY generation: it maps the user's intent to the most fitting
 * A2UI component. It is appended to the system prompt for both built-in and
 * custom personas, since matching the component to the intent is universal.
 *
 * Plain string export — safe to import on client or server.
 */
export const COMPONENT_PLAYBOOK = `COMPONENT PLAYBOOK (match the component to the intent):
- Tabular or comparative data → use a \`table\` (columns = header strings, rows = arrays of cells).
- KPIs, counts, or single metrics → use a \`stat\`; multiple metrics/telemetry → a \`DataDashboard\`.
- Workflow or status columns (todo/doing/done, stages) → use a \`KanbanBoard\`.
- Multiple sections of content → use \`tabs\`.
- A categorical choice → use a \`select\`; a long enumerated list → use a \`list\`.
- Content revealed on click, or "sealed"/"hidden" things → use a \`modal\` (trigger button + content).
- More than 2 sibling cards → wrap them in a \`grid\` (2-3 columns).
- Status labels → use \`badge\` (danger for threats/critical, primary for positive, ghost for unknown, secondary otherwise).
Anti-patterns: do NOT dump everything into one container of paragraphs; do NOT reach for a dashboard/kanban on a simple one-line request — match complexity to the request.`;

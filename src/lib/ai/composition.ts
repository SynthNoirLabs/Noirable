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
- A still picture / photo / portrait / mugshot → use an \`image\` with a short scene DESCRIPTION as its \`prompt\`, e.g. \`{ "type": "image", "prompt": "1940s mugshot of a man in a dark coat", "alt": "Suspect mugshot" }\`; it is generated automatically.
- MOTION footage — surveillance clips, security-cam playback, a moving establishing shot, "footage of…", a short video — → use a \`video\` with a short shot DESCRIPTION as its \`prompt\`, e.g. \`{ "type": "video", "prompt": "grainy security-cam footage of a figure crossing a rain-slick alley", "alt": "Alley surveillance" }\`. It renders as an explicit "Generate footage" placeholder the user clicks on demand (video is expensive — it is NOT generated automatically like images). Use it sparingly and only when motion genuinely fits the request; prefer an \`image\` for anything static.

BUTTON ACTIONS (a \`button\`'s \`action\` must do something concrete — prefer a local \`functionCall\` so the click has a visible effect without a server):
- Change a value the UI shows → \`{ "functionCall": { "call": "setValue", "args": { "path": "/some/field", "value": <new value> } } }\` (bind a Text/Stat/field to that same \`{ "path": "/some/field" }\` so the change is visible).
- Flip a boolean (show/hide, on/off) → \`{ "functionCall": { "call": "toggle", "args": { "path": "/some/flag" } } }\`.
- Open an external link → \`{ "functionCall": { "call": "openUrl", "args": { "url": "https://…" } } }\`.
- Submit a form / case → \`{ "event": { "name": "submit" } }\` (also \`submit_form\`/\`submit_case\`); a counter bump → \`{ "event": { "name": "increment" } }\`. These are the only server events with a built-in effect.
- For "reveal on click" content, prefer a \`modal\` over a button event. Only emit an \`event\` with a custom name when the interaction is genuinely server-bound; a custom event name has NO built-in effect and will only flash a click acknowledgement.
Anti-patterns: do NOT dump everything into one container of paragraphs; do NOT reach for a dashboard/kanban on a simple one-line request — match complexity to the request; do NOT give a button a made-up \`event\` name when a \`setValue\`/\`toggle\` functionCall (bound to visible state) or a \`modal\` would actually work.`;

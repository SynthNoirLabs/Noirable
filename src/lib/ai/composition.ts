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
- KPIs, counts, or single metrics → use a \`stat\`; multiple metrics/telemetry → a \`dataDashboard\` (widgets of type metric/progress/chart).
- Workflow or status columns (todo/doing/done, stages) → use a \`kanbanBoard\` (columns of cards with title/description/assignee/tags).
- CONNECTIONS between people, places, and clues in an investigation — who knew whom, who was where, what links a suspect to the crime — → use a \`relationshipGraph\` (the "suspect web"). It takes \`nodes\` ({ id, label, kind?: "suspect"|"victim"|"location"|"clue"|"witness", detail? }) and \`edges\` ({ from, to, label?, kind?: "alibi"|"motive"|"connection"|"witnessed" }) where \`from\`/\`to\` reference node ids; it renders as a noir cork-board of pushpins wired by red string (motive/alibi edges glow red). Use it when the user wants to SEE relationships, not list them.
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
- A WITNESS STATEMENT / voice log → use an \`audio\` node with the spoken words as its \`script\` and the witness as \`speaker\`, e.g. \`{ "type": "audio", "speaker": "M. Doyle", "description": "Witness statement — M. Doyle", "script": "I saw him at the docks around midnight. He wasn't alone." }\`. It renders as a play-on-demand recording in that speaker's voice; keep scripts to 1-3 spoken sentences.
ESCAPE HATCH (last resort): when the request genuinely CANNOT be expressed with the catalog (a custom visualization, a canvas animation, a tiny game), you MAY emit \`{ "type": "custom", "title": …, "code": "<a complete self-contained React component module: default export, hooks allowed, styled with Tailwind classes, no external imports beyond react>" }\`. It renders in a sandboxed live preview. Prefer catalog components for everything they can express.
RECURRING CHARACTERS (cast continuity): when an image depicts a NAMED person who may appear in other images (a suspect, a guest, an heir), append a tag to the image prompt: \`{ "type": "image", "prompt": "1940s mugshot of a man in a dark coat [character: Victor Kessler]", "alt": "Kessler mugshot" }\`. The same name always renders the SAME face — use the identical name in every image of that person (mugshot, surveillance still, portrait).
PROGRESSIVE ASSEMBLY (multi-section boards): for a board with several distinct sections (e.g. header → stats → table → gallery), you MAY call \`generate_ui\` MULTIPLE times in one turn — once per major section, in display order. Each call's tree is appended below the previous one and renders the moment it arrives, so the board visibly assembles. Use one call for simple requests.
Anti-patterns: do NOT dump everything into one container of paragraphs; do NOT reach for a dashboard/kanban on a simple one-line request — match complexity to the request; do NOT give a button a made-up \`event\` name when a \`setValue\`/\`toggle\` functionCall (bound to visible state) or a \`modal\` would actually work.`;

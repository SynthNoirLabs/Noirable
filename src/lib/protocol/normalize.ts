/**
 * Pre-validation normalization for the legacy A2UI protocol.
 *
 * Models (especially Gemini) emit "legacy-shaped" trees with countless small
 * variations — synonym keys, stray casing, object table rows, kanban/dashboard
 * aliases, a binding object where a string is expected. `normalizeA2UI` repairs
 * those into the canonical shape BEFORE Zod validation in `schema.ts`, so a
 * reasonable model output isn't rejected outright. Split out of `schema.ts`
 * (which re-exports `normalizeA2UI`) to keep that file to types + validation.
 *
 * Pure object transforms — no zod here. Depends only on the leaf primitives in
 * `legacy-constants.ts`, so `schema.ts` can `z.preprocess(normalizeA2UI, …)`
 * without an import cycle.
 */
import { SUPPORTED_LEGACY_TYPES, isBindingObject } from "./legacy-constants";

/**
 * Coerce a single table row to a string[]. Models emit rows as a cell array, an
 * object keyed by column name (or any object), or a scalar. An object row is
 * mapped into `columnNames` order when those keys exist; otherwise its values
 * are used in insertion order. This prevents the "[object Object]" cells that
 * appear when an object row is naively String()-ed.
 */
function coerceTableRow(row: unknown, columnNames: string[]): string[] {
  if (Array.isArray(row)) {
    return row.map((c) => (c == null ? "" : String(c)));
  }
  if (row && typeof row === "object") {
    const obj = row as Record<string, unknown>;
    // Prefer column-name lookup so cells land in the right column. Match keys
    // loosely — lowercased with non-alphanumerics stripped — so "Last Seen"
    // (column) lines up with `lastSeen`/`last_seen` (object key).
    const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const looseKeys = new Map(Object.keys(obj).map((k) => [loose(k), k]));
    const matched = columnNames.length > 0 && columnNames.some((c) => looseKeys.has(loose(c)));
    if (matched) {
      return columnNames.map((c) => {
        const key = looseKeys.get(loose(c));
        const v = key ? obj[key] : undefined;
        return v == null ? "" : String(v);
      });
    }
    return Object.values(obj).map((v) => (v == null ? "" : String(v)));
  }
  return [row == null ? "" : String(row)];
}

/** Record alias used by the per-type normalizers below. */
type Obj = Record<string, unknown>;

/**
 * Lift the first present string among `title`/`name`/`label` into a title,
 * defaulting to "". Used by the kanban column/card and dashboard widget
 * normalizers, where models scatter the title across these synonyms.
 */
function liftTitle(obj: Obj): string {
  return typeof obj.title === "string"
    ? obj.title
    : typeof obj.name === "string"
      ? obj.name
      : typeof obj.label === "string"
        ? obj.label
        : "";
}

/**
 * Canonicalize the `type` spelling. Models emit the PascalCase names from the
 * prompts ("KanbanBoard"/"DataDashboard"), shorthand ("kanban", "dashboard"),
 * or stray capitalization ("Card"); all collapse to the canonical entry in
 * SUPPORTED_LEGACY_TYPES. Returns the (possibly rewritten) type and node.
 */
function canonicalizeType(type: unknown, node: Obj): { type: unknown; node: Obj } {
  if (typeof type !== "string") return { type, node };
  const flat = type.toLowerCase().replace(/[^a-z]/g, "");
  const TYPE_ALIASES: Record<string, string> = {
    kanban: "kanbanBoard",
    kanbanboard: "kanbanBoard",
    dashboard: "dataDashboard",
    datadashboard: "dataDashboard",
    suspectweb: "relationshipGraph",
    relationshipgraph: "relationshipGraph",
    relationship: "relationshipGraph",
    graph: "relationshipGraph",
    datetime: "dateTimeInput",
    datetimeinput: "dateTimeInput",
    datepicker: "dateTimeInput",
    timepicker: "dateTimeInput",
    date: "dateTimeInput",
    time: "dateTimeInput",
  };
  const canonical =
    TYPE_ALIASES[flat] ?? SUPPORTED_LEGACY_TYPES.find((t) => t.toLowerCase() === flat);
  if (canonical && canonical !== type) {
    return { type: canonical, node: { ...node, type: canonical } };
  }
  return { type, node };
}

/** text/callout: lift a `text` field into `content` when content is missing. */
function normalizeTextLike(node: Obj): Obj {
  // A binding object is a valid `content` now — leave it for the resolver.
  if (isBindingObject(node.content)) return node;
  if (typeof node.content !== "string" && typeof node.text === "string") {
    return { ...node, content: node.text };
  }
  // A bound `text` (e.g. `{ path }`) lifts into `content` unchanged.
  if (typeof node.content !== "string" && isBindingObject(node.text)) {
    return { ...node, content: node.text };
  }
  return node;
}

/**
 * Models often emit `card` as a generic container with a `children` array
 * (sometimes alongside a title/description). The legacy `card` has no
 * `children` field and only renders title/description, which would drop the
 * nested content. Reinterpret any card-with-children as a `container`, lifting
 * a title/description into leading heading + text nodes so nothing is lost.
 */
function normalizeCard(node: Obj): Obj {
  if (!Array.isArray(node.children)) return node;
  const lead: Obj[] = [];
  if (typeof node.title === "string") {
    lead.push({ type: "heading", text: node.title, level: 3 });
  }
  if (typeof node.description === "string") {
    lead.push({ type: "paragraph", text: node.description });
  }
  const rest = { ...node };
  delete rest.title;
  delete rest.description;
  delete rest.status;
  return {
    ...rest,
    type: "container",
    children: [...lead, ...(node.children as unknown[])],
  };
}

/**
 * Clamp `variant` to the supported token set. Models invent values like
 * "warning", "success", "info", "error" — map the common ones to the nearest
 * supported token and drop anything else so one stray value doesn't fail the
 * whole tree.
 */
function normalizeVariant(node: Obj): Obj {
  if (typeof node.variant !== "string") return node;
  const VARIANTS = new Set(["primary", "secondary", "ghost", "danger"]);
  if (VARIANTS.has(node.variant)) return node;
  const VARIANT_ALIASES: Record<string, string> = {
    warning: "danger",
    error: "danger",
    destructive: "danger",
    critical: "danger",
    success: "secondary",
    info: "secondary",
    muted: "ghost",
    outline: "ghost",
    default: "primary",
  };
  const mapped = VARIANT_ALIASES[node.variant.toLowerCase()];
  if (mapped) {
    return { ...node, variant: mapped };
  }
  const next = { ...node };
  delete next.variant;
  return next;
}

/**
 * Grid: models use `cols` instead of `columns`, and/or a number instead of the
 * "2"|"3"|"4" string enum. Coerce both, clamp to range, and ensure children.
 */
function normalizeGrid(node: Obj): Obj {
  const rawCols = node.columns ?? node.cols;
  const next = { ...node };
  delete next.cols;
  if (rawCols !== undefined) {
    const n = Math.min(4, Math.max(2, Number(rawCols) || 2));
    next.columns = String(n);
  }
  if (!Array.isArray(next.children)) {
    next.children = [];
  }
  return next;
}

/**
 * Layout/container types require a `children` array; default to empty if the
 * model omitted it so a childless container doesn't fail the whole tree.
 */
function normalizeLayout(node: Obj): Obj {
  if (!Array.isArray(node.children)) {
    return { ...node, children: [] };
  }
  return node;
}

/**
 * Table: models frequently name the columns `headers` (or `header`) instead of
 * `columns`, and may omit `rows`. Coerce to the required shape so one synonym
 * doesn't reject the whole tree.
 */
function normalizeTable(node: Obj): Obj {
  const cols = node.columns ?? node.headers ?? node.header;
  const next = { ...node };
  delete next.headers;
  delete next.header;
  const columnNames = Array.isArray(cols) ? cols.map(String) : [];
  next.columns = columnNames;
  // Rows come in three shapes from models: an array of cell arrays, an array
  // of objects keyed by column name (→ map into column order so they don't
  // stringify to "[object Object]"), or a scalar. Coerce all to string[].
  next.rows = Array.isArray(node.rows)
    ? (node.rows as unknown[]).map((r) => coerceTableRow(r, columnNames))
    : [];
  return next;
}

/**
 * kanbanBoard: tolerate `name`/`label` column titles, `items` for cards,
 * string cards, and missing arrays — one loose column must not reject the
 * whole board.
 */
function normalizeKanban(node: Obj): Obj {
  const cols = Array.isArray(node.columns) ? node.columns : [];
  return {
    ...node,
    columns: cols.map((col) => {
      if (typeof col === "string") return { title: col, cards: [] };
      if (!col || typeof col !== "object") return { title: "", cards: [] };
      const c = col as Obj;
      const title = liftTitle(c);
      const rawCards = Array.isArray(c.cards) ? c.cards : Array.isArray(c.items) ? c.items : [];
      const cards = rawCards.map((card) => {
        if (typeof card === "string") return { title: card };
        if (!card || typeof card !== "object") return { title: "" };
        const k = card as Obj;
        const cardTitle =
          typeof k.title === "string"
            ? k.title
            : typeof k.label === "string"
              ? k.label
              : typeof k.name === "string"
                ? k.name
                : "";
        return { ...k, title: cardTitle };
      });
      const rest = { ...c };
      delete rest.items;
      return { ...rest, title, cards };
    }),
  };
}

/**
 * dataDashboard: tolerate `metrics`/`items` as the widget list, lifted
 * label/name titles, and a missing widget `type` (inferred from the fields
 * present: data → chart, progress → progress, else metric).
 */
function normalizeDashboard(node: Obj): Obj {
  const rawWidgets = Array.isArray(node.widgets)
    ? node.widgets
    : Array.isArray(node.metrics)
      ? node.metrics
      : Array.isArray(node.items)
        ? node.items
        : [];
  const next = { ...node };
  delete next.metrics;
  delete next.items;
  next.widgets = rawWidgets.map((w) => {
    if (!w || typeof w !== "object") {
      return { title: w == null ? "" : String(w), type: "metric", value: "" };
    }
    const o = w as Obj;
    const title = liftTitle(o);
    let widgetType = o.type;
    if (widgetType !== "metric" && widgetType !== "progress" && widgetType !== "chart") {
      widgetType = Array.isArray(o.data)
        ? "chart"
        : typeof o.progress === "number"
          ? "progress"
          : "metric";
    }
    const widget: Obj = { ...o, title, type: widgetType };
    // Models frequently emit the trend delta as a string ("12", "+5%", "-3").
    // The schema requires a number, so coerce: strip any non-numeric chrome
    // (sign-leading %, commas) and drop the trend entirely if it isn't numeric
    // rather than letting one bad widget reject the whole dashboard.
    if (widget.trend && typeof widget.trend === "object") {
      const t = widget.trend as Obj;
      if (typeof t.value === "string") {
        const parsed = Number(t.value.replace(/[%,\s]/g, ""));
        if (Number.isFinite(parsed)) {
          widget.trend = { ...t, value: parsed };
        } else {
          delete widget.trend;
        }
      }
    }
    return widget;
  });
  return next;
}

const BUTTON_ACTIONS = new Set(["submit", "reset", "log"]);

/**
 * button: the schema only accepts `action: "submit" | "reset" | "log"`. Models
 * routinely invent actions ("navigate", "open", "close", a URL, …). Drop any
 * action outside the allowed set so the button still renders (as a plain,
 * action-less button) instead of being salvaged away entirely.
 */
function normalizeButton(node: Obj): Obj {
  if (typeof node.action === "string" && !BUTTON_ACTIONS.has(node.action)) {
    const next = { ...node };
    delete next.action;
    return next;
  }
  return node;
}

/**
 * relationshipGraph: tolerate the shapes models reach for — edges under
 * `links`/`relationships`, edge endpoints as `source`/`target`, and node labels
 * scattered across `label`/`name`/`title`. Coerce to the strict node/edge
 * shape, dropping endpoints that aren't strings, so one loose entry doesn't
 * reject the whole graph.
 */
function normalizeRelationshipGraph(node: Obj): Obj {
  const rawNodes = Array.isArray(node.nodes) ? node.nodes : [];
  const rawEdges = Array.isArray(node.edges)
    ? node.edges
    : Array.isArray(node.links)
      ? node.links
      : Array.isArray(node.relationships)
        ? node.relationships
        : [];
  const next = { ...node };
  delete next.links;
  delete next.relationships;
  next.nodes = rawNodes.map((entry, index) => {
    if (typeof entry === "string") return { id: entry, label: entry };
    if (!entry || typeof entry !== "object") return { id: String(index), label: "" };
    const n = entry as Obj;
    const id = typeof n.id === "string" ? n.id : liftTitle(n) || String(index);
    const label = liftTitle(n) || id;
    return { ...n, id, label };
  });
  next.edges = rawEdges
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Obj;
      const from =
        typeof e.from === "string" ? e.from : typeof e.source === "string" ? e.source : "";
      const to = typeof e.to === "string" ? e.to : typeof e.target === "string" ? e.target : "";
      if (!from || !to) return null;
      const rest = { ...e };
      delete rest.source;
      delete rest.target;
      return { ...rest, from, to };
    })
    .filter((edge): edge is NonNullable<typeof edge> => edge !== null);
  return next;
}

/**
 * Audio statement: lift `text`/`content`/`statement` into `script` so loose
 * model shapes still validate.
 */
function normalizeAudio(node: Obj): Obj {
  if (typeof node.script === "string") return node;
  const lifted =
    typeof node.text === "string"
      ? node.text
      : typeof node.content === "string"
        ? node.content
        : typeof node.statement === "string"
          ? node.statement
          : undefined;
  if (!lifted) return node;
  const next: Obj = { ...node, script: lifted };
  delete next.text;
  delete next.content;
  delete next.statement;
  return next;
}

/** Types that require a string `label`. */
const LABEL_REQUIRED = new Set([
  "badge",
  "stat",
  "input",
  "textarea",
  "select",
  "checkbox",
  "button",
]);

/**
 * Default a missing `label` to "" (or lift `text`/`content`) for the
 * label-requiring types, so one bare node doesn't fail the whole tree.
 */
function normalizeLabels(node: Obj): Obj {
  const lifted =
    typeof node.text === "string"
      ? node.text
      : typeof node.content === "string"
        ? node.content
        : "";
  return { ...node, label: lifted };
}

/** `select` requires a non-empty `options` string array. */
function normalizeSelect(node: Obj): Obj {
  if (!Array.isArray(node.options)) {
    return { ...node, options: [] };
  }
  if (node.options.length === 0) {
    return { ...node, options: ["Option"] };
  }
  return node;
}

/** `stat` value: a string, a live binding (left intact), or a coerced scalar. */
function normalizeStat(node: Obj): Obj {
  if (typeof node.value === "string") return node;
  // A `{ path }`/`functionCall` binding is valid now — keep it for the resolver
  // instead of stringifying it to "[object Object]".
  if (isBindingObject(node.value)) return node;
  return {
    ...node,
    value: node.value === undefined || node.value === null ? "" : String(node.value),
  };
}

/** `badge` requires a string `label`; lift `text`/`content` when missing. */
function normalizeBadge(node: Obj): Obj {
  if (typeof node.label === "string") return node;
  const badgeLabel =
    typeof node.text === "string"
      ? node.text
      : typeof node.content === "string"
        ? node.content
        : undefined;
  if (!badgeLabel) return node;
  const next: Obj = { ...node, label: badgeLabel };
  delete next.text;
  delete next.content;
  return next;
}

/** `image` requires an `alt`; fall back to the prompt or a generic label. */
function normalizeImage(node: Obj): Obj {
  const altFallback =
    typeof node.alt === "string"
      ? node.alt
      : typeof node.prompt === "string"
        ? node.prompt
        : "Generated image";
  return { ...node, alt: altFallback };
}

/**
 * Video: unlike images (whose prompt is resolved into a real src), a video's
 * prompt is kept as the `src` text on purpose — the renderer treats a non-URL
 * src as the on-demand "Generate footage" seed. So coalesce prompt → src when
 * only a prompt was given, and supply an alt fallback for accessibility.
 */
function normalizeVideo(node: Obj): Obj {
  const src =
    typeof node.src === "string" && node.src
      ? node.src
      : typeof node.prompt === "string"
        ? node.prompt
        : "";
  const altFallback =
    typeof node.alt === "string"
      ? node.alt
      : typeof node.prompt === "string"
        ? node.prompt
        : "Generated footage";
  return { ...node, src, alt: altFallback };
}

/**
 * tabs: each tab must be { label: string, content: A2UIComponent }. Models use
 * many shapes: a `children` array, a `panel`/`body` alias, or just a label with
 * the content omitted entirely. Coerce all of them, and drop stray fields like
 * `id` that the tab schema doesn't allow.
 */
function normalizeTabs(node: Obj): Obj {
  if (!Array.isArray(node.tabs)) return node;
  return {
    ...node,
    tabs: node.tabs.map((tab, i) => {
      if (typeof tab !== "object" || tab === null) return tab;
      const tabObj = tab as Obj;

      const label =
        typeof tabObj.label === "string"
          ? tabObj.label
          : typeof tabObj.title === "string"
            ? tabObj.title
            : `Tab ${i + 1}`;

      let content = tabObj.content ?? tabObj.panel ?? tabObj.body;
      if (content === undefined && Array.isArray(tabObj.children)) {
        content = { type: "container", children: tabObj.children };
      }
      if (content === undefined || content === null) {
        content = { type: "container", children: [] };
      }

      return { label, content: normalizeA2UI(content) };
    }),
  };
}

export function normalizeA2UI(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((entry) => normalizeA2UI(entry));
  }

  if (typeof input !== "object" || input === null) {
    return input;
  }

  // Canonicalize the `type` spelling FIRST so every later type-keyed branch and
  // the discriminated union see one spelling.
  const canon = canonicalizeType((input as Obj).type, { ...(input as Obj) });
  const type = canon.type;
  let normalized: Obj = canon.node;

  if (type === "text" || type === "callout") {
    normalized = normalizeTextLike(normalized);
  }

  if (type === "card") {
    normalized = normalizeCard(normalized);
  }

  normalized = normalizeVariant(normalized);

  if (type === "grid") {
    normalized = normalizeGrid(normalized);
  }

  if (type === "container" || type === "row" || type === "column") {
    normalized = normalizeLayout(normalized);
  }

  if (type === "table") {
    normalized = normalizeTable(normalized);
  }

  if (type === "kanbanBoard") {
    normalized = normalizeKanban(normalized);
  }

  if (type === "dataDashboard") {
    normalized = normalizeDashboard(normalized);
  }

  if (type === "relationshipGraph") {
    normalized = normalizeRelationshipGraph(normalized);
  }

  if (type === "audio") {
    normalized = normalizeAudio(normalized);
  }

  if (
    typeof type === "string" &&
    LABEL_REQUIRED.has(type) &&
    typeof normalized.label !== "string"
  ) {
    normalized = normalizeLabels(normalized);
  }

  if (type === "select") {
    normalized = normalizeSelect(normalized);
  }

  if (type === "stat") {
    normalized = normalizeStat(normalized);
  }

  if (type === "badge") {
    normalized = normalizeBadge(normalized);
  }

  if (type === "image") {
    normalized = normalizeImage(normalized);
  }

  if (type === "video") {
    normalized = normalizeVideo(normalized);
  }

  if (type === "button") {
    normalized = normalizeButton(normalized);
  }

  if (Array.isArray(normalized.children)) {
    normalized = {
      ...normalized,
      children: normalized.children.map((child) => normalizeA2UI(child)),
    };
  }

  if (type === "tabs") {
    normalized = normalizeTabs(normalized);
  }

  return normalized;
}

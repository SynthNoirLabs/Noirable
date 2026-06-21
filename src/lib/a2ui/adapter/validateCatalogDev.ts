import type { z } from "zod";
import {
  rowSchema,
  columnSchema,
  listSchema,
  cardSchema,
  tabsSchema,
  dividerSchema,
  modalSchema,
  textSchema,
  imageSchema,
  iconSchema,
  videoSchema,
  audioPlayerSchema,
  buttonSchema,
  checkBoxSchema,
  textFieldSchema,
  dateTimeInputSchema,
  choicePickerSchema,
  sliderSchema,
  kanbanBoardSchema,
  dataDashboardSchema,
  relationshipGraphSchema,
} from "@/lib/a2ui/catalog/components";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

/**
 * DEV-ONLY drift detector for the v0.9 catalog contract.
 *
 * The adapter (`flattenLegacyToCatalog`) emits flat catalog objects that the
 * runtime renderer consumes WITHOUT validation — so the catalog schemas in
 * `catalog/components.ts` (the v0.9 target contract) are otherwise only
 * exercised by their own unit tests, never against real adapter output. This
 * makes the schemas load-bearing in development: each emitted component is
 * checked against its catalog schema and any mismatch is surfaced via
 * `console.warn`, so drift between what the adapter produces and the contract
 * the catalog declares becomes visible during development.
 *
 * It is intentionally NON-THROWING and does NOT alter output: a warning is the
 * only effect. Components whose `component` value has no catalog schema (the
 * adapter emits a few extension components like Badge/Stat/Grid/Table/CustomCode
 * that the standard catalog doesn't define) are skipped silently — we only warn
 * when a schema exists and the emitted shape fails it.
 */

/** Catalog schemas keyed by their `component` discriminator. */
const CATALOG_SCHEMAS: Record<string, z.ZodTypeAny> = {
  Row: rowSchema,
  Column: columnSchema,
  List: listSchema,
  Card: cardSchema,
  Tabs: tabsSchema,
  Divider: dividerSchema,
  Modal: modalSchema,
  Text: textSchema,
  Image: imageSchema,
  Icon: iconSchema,
  Video: videoSchema,
  AudioPlayer: audioPlayerSchema,
  Button: buttonSchema,
  CheckBox: checkBoxSchema,
  TextField: textFieldSchema,
  DateTimeInput: dateTimeInputSchema,
  ChoicePicker: choicePickerSchema,
  Slider: sliderSchema,
  KanbanBoard: kanbanBoardSchema,
  DataDashboard: dataDashboardSchema,
  RelationshipGraph: relationshipGraphSchema,
};

/**
 * Validate each emitted catalog component against its catalog schema and warn
 * (never throw) on drift. No-ops in production. Cheap: only runs the Zod parse
 * for components whose `component` has a known schema.
 */
export function warnOnCatalogDrift(components: SurfaceComponent[]): void {
  if (process.env.NODE_ENV === "production") return;

  for (const component of components) {
    const schema = CATALOG_SCHEMAS[component.component as string];
    if (!schema) continue;
    const parsed = schema.safeParse(component);
    if (!parsed.success) {
      console.warn(
        `[a2ui] adapter output drifts from the v0.9 catalog contract for "${String(
          component.component
        )}" (id: ${String(component.id)})`,
        parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`)
      );
    }
  }
}

"use client";

import React, { useMemo } from "react";
import { SurfaceRenderer } from "@/components/a2ui/SurfaceRenderer";
import type { SurfaceComponent, SurfaceState } from "@/lib/a2ui/surfaces/manager";

/**
 * A2UI v0.9 E2E harness.
 *
 * Mounts a SurfaceRenderer with a rich, deterministic surface that exercises
 * the full v0.9 feature set in a real browser: all component categories,
 * function-call + template-children bindings, two-way binding, field
 * validation, and the server-action HTTP round-trip (against the real
 * /api/a2ui/action endpoint).
 *
 * This page exists for Playwright DOM-level tests and manual smoke-checking.
 * It does not depend on an AI provider.
 */

const COMPONENTS: SurfaceComponent[] = [
  {
    id: "root",
    component: "Column",
    children: [
      "greeting",
      "nameField",
      "emailField",
      "agree",
      "suspectsList",
      "fileBtn",
      "status",
      "badgeRow",
      "statsGrid",
      "evidenceTable",
      "modalRoot",
    ],
  },
  // Row of status badges (pills).
  { id: "badgeRow", component: "Row", children: ["b1", "b2", "b3"] },
  { id: "b1", component: "Badge", label: "Active", variant: "primary" },
  { id: "b2", component: "Badge", label: "High Risk", variant: "danger" },
  { id: "b3", component: "Badge", label: "Cold", variant: "ghost" },
  // Stat tiles in a real grid.
  { id: "statsGrid", component: "Grid", columns: "3", children: ["s1", "s2", "s3"] },
  { id: "s1", component: "Stat", label: "Open Leads", value: "7", helper: "+2 today" },
  { id: "s2", component: "Stat", label: "Days Missing", value: "14" },
  { id: "s3", component: "Stat", label: "Bounty", value: "50,000 CR" },
  // A real data table.
  {
    id: "evidenceTable",
    component: "Table",
    columns: ["Item", "Location", "Status"],
    rows: [
      ["Cracked Cybernetic Eye", "The Electric Sheep club", "Undergoing diagnostics"],
      ["Shattered Datapad", "Drainage pipe, Sector 4", "Data recovery in progress"],
      ["Rain-soaked Trenchcoat", "Pier 9 warehouse", "Logged in locker #12"],
    ],
  },
  // Modal: trigger button opens a content panel.
  { id: "modalRoot", component: "Modal", trigger: "modalTrigger", content: "modalBody" },
  {
    id: "modalTrigger",
    component: "Button",
    variant: "borderless",
    label: "View Classified Notes",
    action: { event: { name: "noop" } },
  },
  { id: "modalBody", component: "Text", text: "REDACTED. Some things stay buried." },
  // Function-call binding: concat of two data-model fields.
  {
    id: "greeting",
    component: "Text",
    variant: "h2",
    text: { call: "concat", args: { values: ["Case for ", { path: "/name" }] } },
  },
  // Two-way bound text field.
  { id: "nameField", component: "TextField", label: "Detective", value: { path: "/name" } },
  // Validated email field.
  {
    id: "emailField",
    component: "TextField",
    label: "Contact email",
    value: { path: "/email" },
    checks: [{ call: "email", message: "That badge number won't fly — bad email." }],
  },
  // Two-way bound checkbox.
  { id: "agree", component: "CheckBox", label: "Case is active", value: { path: "/active" } },
  // Template children over a data-model array (relative pointer per item).
  {
    id: "suspectsList",
    component: "List",
    children: { componentId: "suspectTpl", path: "/suspects" },
  },
  { id: "suspectTpl", component: "Text", text: { path: "name" } },
  // Server-event button → /api/a2ui/action round-trip → sets /status.
  { id: "fileBtn", component: "Button", child: "fileLbl", action: { event: { name: "submit" } } },
  { id: "fileLbl", component: "Text", text: "File the case" },
  {
    id: "status",
    component: "Text",
    text: { call: "concat", args: { values: [{ path: "/status" }] } },
  },
];

export default function A2UIHarnessPage() {
  const surface = useMemo<SurfaceState>(
    () => ({
      config: { surfaceId: "harness", catalogId: "standard" },
      components: new Map(COMPONENTS.map((c) => [c.id, c])),
      dataModel: {
        name: "Spade",
        email: "",
        active: false,
        status: "",
        suspects: [{ name: "Brigid" }, { name: "Joel" }, { name: "Wilmer" }],
      },
      createdAt: 0,
    }),
    []
  );

  return (
    <main className="min-h-screen bg-[var(--aesthetic-background)] p-8" data-testid="a2ui-harness">
      <h1 className="font-typewriter text-[var(--aesthetic-accent)] text-sm uppercase tracking-[0.3em] mb-4">
        A2UI v0.9 Harness
      </h1>
      <SurfaceRenderer surface={surface} theme="noir" />
    </main>
  );
}

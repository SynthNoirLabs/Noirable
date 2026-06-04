"use client";

import React, { useMemo } from "react";
import { SurfaceRenderer } from "@/components/a2ui/SurfaceRenderer";
import type { SurfaceComponent, SurfaceState } from "@/lib/a2ui/surfaces/manager";

/**
 * A2UI v0.9 component gallery — renders EVERY catalog component plus realistic
 * compositions in one surface, so the whole rendered set can be reviewed at
 * once (rather than chasing one model prompt at a time). Used for visual QA.
 */

const C: SurfaceComponent[] = [
  {
    id: "root",
    component: "Column",
    children: [
      "h_text",
      "txt_h1",
      "txt_h2",
      "txt_h3",
      "txt_body",
      "txt_caption",
      "d1",
      "h_badges",
      "badgeRow",
      "d2",
      "h_stats",
      "statsGrid",
      "d3",
      "h_table",
      "tbl",
      "d4",
      "h_inputs",
      "inName",
      "inEmail",
      "inLong",
      "cb",
      "picker",
      "dt",
      "slider",
      "d5",
      "h_buttons",
      "btnRow",
      "d6",
      "h_card",
      "card1",
      "d7",
      "h_tabs",
      "tabs1",
      "d8",
      "h_modal",
      "modal1",
    ],
  },

  // --- Text variants ---
  { id: "h_text", component: "Text", variant: "h2", text: "Text variants" },
  { id: "txt_h1", component: "Text", variant: "h1", text: "Heading 1" },
  { id: "txt_h2", component: "Text", variant: "h2", text: "Heading 2" },
  { id: "txt_h3", component: "Text", variant: "h3", text: "Heading 3" },
  { id: "txt_body", component: "Text", text: "Body text — the rain never stops in this town." },
  { id: "txt_caption", component: "Text", variant: "caption", text: "Caption / muted line" },

  { id: "d1", component: "Divider" },

  // --- Badges (every variant) ---
  { id: "h_badges", component: "Text", variant: "h2", text: "Badges" },
  { id: "badgeRow", component: "Row", children: ["bg1", "bg2", "bg3", "bg4"] },
  { id: "bg1", component: "Badge", label: "Primary", variant: "primary" },
  { id: "bg2", component: "Badge", label: "Danger", variant: "danger" },
  { id: "bg3", component: "Badge", label: "Secondary", variant: "secondary" },
  { id: "bg4", component: "Badge", label: "Ghost", variant: "ghost" },

  { id: "d2", component: "Divider" },

  // --- Stats in a grid ---
  { id: "h_stats", component: "Text", variant: "h2", text: "Stats (grid)" },
  { id: "statsGrid", component: "Grid", columns: "3", children: ["st1", "st2", "st3"] },
  { id: "st1", component: "Stat", label: "Open Leads", value: "7", helper: "+2 today" },
  { id: "st2", component: "Stat", label: "Days Missing", value: "14" },
  { id: "st3", component: "Stat", label: "Bounty", value: "50,000 CR" },

  { id: "d3", component: "Divider" },

  // --- Table ---
  { id: "h_table", component: "Text", variant: "h2", text: "Table" },
  {
    id: "tbl",
    component: "Table",
    columns: ["Item", "Location", "Status"],
    rows: [
      ["Cracked Cyber-eye", "The Electric Sheep", "Diagnostics"],
      ["Shattered Datapad", "Sector 4 drain", "Recovery"],
      ["Trenchcoat", "Pier 9", "Locker #12"],
    ],
  },

  { id: "d4", component: "Divider" },

  // --- Inputs ---
  { id: "h_inputs", component: "Text", variant: "h2", text: "Inputs" },
  { id: "inName", component: "TextField", label: "Name", value: { path: "/name" } },
  {
    id: "inEmail",
    component: "TextField",
    label: "Email",
    value: { path: "/email" },
    checks: [{ call: "email", message: "Bad email." }],
  },
  {
    id: "inLong",
    component: "TextField",
    label: "Notes",
    variant: "longText",
    value: { path: "/notes" },
  },
  { id: "cb", component: "CheckBox", label: "Mark urgent", value: { path: "/urgent" } },
  {
    id: "picker",
    component: "ChoicePicker",
    label: "Case",
    variant: "mutuallyExclusive",
    options: [
      { label: "Case 904", value: "904" },
      { label: "Case 887", value: "887" },
    ],
    value: [],
  },
  {
    id: "dt",
    component: "DateTimeInput",
    value: { path: "/when" },
    accessibility: { label: "Date" },
  },
  {
    id: "slider",
    component: "Slider",
    label: "Threat level",
    min: 0,
    max: 10,
    value: { path: "/threat" },
  },

  { id: "d5", component: "Divider" },

  // --- Buttons ---
  { id: "h_buttons", component: "Text", variant: "h2", text: "Buttons" },
  { id: "btnRow", component: "Row", children: ["btnPrimary", "btnBorderless"] },
  {
    id: "btnPrimary",
    component: "Button",
    label: "Primary Action",
    action: { event: { name: "noop" } },
  },
  {
    id: "btnBorderless",
    component: "Button",
    variant: "borderless",
    label: "Borderless",
    action: { event: { name: "noop" } },
  },

  { id: "d6", component: "Divider" },

  // --- Card (noir paper frame) ---
  { id: "h_card", component: "Text", variant: "h2", text: "Card" },
  { id: "card1", component: "Card", child: "cardBody" },
  { id: "cardBody", component: "Column", children: ["cardTitle", "cardText"] },
  { id: "cardTitle", component: "Text", variant: "h3", text: "Dossier: Vera" },
  { id: "cardText", component: "Text", text: "Last seen near the docks. Considered dangerous." },

  { id: "d7", component: "Divider" },

  // --- Tabs ---
  { id: "h_tabs", component: "Text", variant: "h2", text: "Tabs" },
  {
    id: "tabs1",
    component: "Tabs",
    tabs: [
      { title: "Overview", child: "tabA" },
      { title: "Evidence", child: "tabB" },
    ],
  },
  { id: "tabA", component: "Text", text: "Overview panel content." },
  { id: "tabB", component: "Text", text: "Evidence panel content." },

  { id: "d8", component: "Divider" },

  // --- Modal ---
  { id: "h_modal", component: "Text", variant: "h2", text: "Modal" },
  { id: "modal1", component: "Modal", trigger: "modalBtn", content: "modalBody" },
  {
    id: "modalBtn",
    component: "Button",
    variant: "borderless",
    label: "Open Modal",
    action: { event: { name: "noop" } },
  },
  { id: "modalBody", component: "Text", text: "Classified. Eyes only." },
];

export default function A2UIGalleryPage() {
  const surface = useMemo<SurfaceState>(
    () => ({
      config: { surfaceId: "gallery", catalogId: "standard" },
      components: new Map(C.map((c) => [c.id, c])),
      dataModel: { name: "Spade", email: "", notes: "", urgent: false, when: "", threat: 6 },
      createdAt: 0,
    }),
    []
  );

  return (
    <main className="min-h-screen bg-[var(--aesthetic-background)] p-8" data-testid="a2ui-gallery">
      <SurfaceRenderer surface={surface} theme="noir" />
    </main>
  );
}

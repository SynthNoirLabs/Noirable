import type { A2UIInput } from "@/lib/protocol/schema";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: "form" | "dashboard" | "card" | "layout" | "data";
  data: A2UIInput;
}

export const TEMPLATES: Template[] = [
  // Forms
  {
    id: "contact-form",
    name: "Contact Form",
    description: "Simple contact form with name, email, and message fields",
    category: "form",
    data: {
      type: "container",
      style: { padding: "lg", gap: "md" },
      children: [
        { type: "heading", text: "Contact Us", level: 2 },
        {
          type: "input",
          name: "name",
          label: "Full Name",
          placeholder: "John Doe",
        },
        {
          type: "input",
          name: "email",
          label: "Email Address",
          placeholder: "john@example.com",
        },
        {
          type: "textarea",
          name: "message",
          label: "Message",
          placeholder: "How can we help you?",
        },
        {
          type: "button",
          label: "Send Message",
          variant: "primary",
          action: "submit",
        },
      ],
    },
  },
  {
    id: "login-form",
    name: "Login Form",
    description: "Authentication form with email and password",
    category: "form",
    data: {
      type: "container",
      style: { padding: "lg", gap: "md" },
      children: [
        { type: "heading", text: "Sign In", level: 2 },
        {
          type: "text",
          content: "Welcome back. Enter your credentials to continue.",
          priority: "low",
        },
        {
          type: "input",
          name: "email",
          label: "Email",
          placeholder: "you@example.com",
        },
        {
          type: "input",
          name: "password",
          label: "Password",
          placeholder: "••••••••",
        },
        {
          type: "checkbox",
          name: "remember",
          label: "Remember me",
        },
        {
          type: "button",
          label: "Sign In",
          variant: "primary",
          action: "submit",
        },
      ],
    },
  },

  // Cards
  {
    id: "suspect-card",
    name: "Suspect Profile",
    description: "Noir-themed suspect dossier card",
    category: "card",
    data: {
      type: "container",
      style: { padding: "md", gap: "md" },
      children: [
        {
          type: "card",
          title: "SUSPECT PROFILE",
          description: "Classified Information",
          status: "active",
        },
        {
          type: "image",
          prompt: "noir detective mugshot silhouette, black and white",
          alt: "Suspect photo",
        },
        {
          type: "list",
          items: [
            "Last seen: Downtown District",
            "Known associates: Unknown",
            "Status: Under surveillance",
          ],
        },
        { type: "badge", label: "PRIORITY", variant: "danger" },
      ],
    },
  },
  {
    id: "stats-card",
    name: "Statistics Card",
    description: "Display key metrics in a compact card",
    category: "card",
    data: {
      type: "container",
      style: { padding: "md", gap: "md" },
      children: [
        { type: "heading", text: "Monthly Overview", level: 2 },
        {
          type: "row",
          style: { gap: "md" },
          children: [
            {
              type: "column",
              children: [
                { type: "text", content: "Total Cases", priority: "low" },
                { type: "heading", text: "247", level: 2 },
              ],
            },
            {
              type: "column",
              children: [
                { type: "text", content: "Solved", priority: "low" },
                { type: "heading", text: "189", level: 2 },
              ],
            },
            {
              type: "column",
              children: [
                { type: "text", content: "Pending", priority: "low" },
                { type: "heading", text: "58", level: 2 },
              ],
            },
          ],
        },
      ],
    },
  },

  // Dashboards
  {
    id: "case-dashboard",
    name: "Case Dashboard",
    description: "Overview dashboard with stats and recent activity",
    category: "dashboard",
    data: {
      type: "container",
      style: { padding: "lg", gap: "lg" },
      children: [
        { type: "heading", text: "Case Management Dashboard", level: 1 },
        {
          type: "row",
          style: { gap: "md" },
          children: [
            {
              type: "column",
              children: [
                {
                  type: "card",
                  title: "Active Cases",
                  description: "24 cases",
                  status: "active",
                },
              ],
            },
            {
              type: "column",
              children: [
                {
                  type: "card",
                  title: "Closed This Week",
                  description: "12 cases",
                  status: "archived",
                },
              ],
            },
            {
              type: "column",
              children: [
                {
                  type: "card",
                  title: "Pending Review",
                  description: "8 cases",
                  status: "missing",
                },
              ],
            },
          ],
        },
        { type: "divider" },
        { type: "heading", text: "Recent Activity", level: 3 },
        {
          type: "table",
          columns: ["Case", "Status", "Updated"],
          rows: [
            ["Case #2847", "In Progress", "2 hours ago"],
            ["Case #2846", "Under Review", "5 hours ago"],
            ["Case #2845", "Closed", "1 day ago"],
          ],
        },
      ],
    },
  },

  // Data Display
  {
    id: "data-table",
    name: "Data Table",
    description: "Structured table with sortable columns",
    category: "data",
    data: {
      type: "container",
      style: { padding: "md", gap: "md" },
      children: [
        {
          type: "row",
          style: { gap: "md" },
          children: [
            { type: "heading", text: "Evidence Log", level: 2 },
            { type: "badge", label: "12 items", variant: "secondary" },
          ],
        },
        {
          type: "table",
          columns: ["ID", "Description", "Location", "Date", "Status"],
          rows: [
            [
              "EV-001",
              "Fingerprint sample",
              "Crime scene A",
              "Jan 15",
              "Analyzed",
            ],
            [
              "EV-002",
              "Security footage",
              "Building lobby",
              "Jan 15",
              "Pending",
            ],
            [
              "EV-003",
              "Witness statement",
              "Interview room",
              "Jan 16",
              "Verified",
            ],
            [
              "EV-004",
              "Document fragment",
              "Suspect residence",
              "Jan 17",
              "Processing",
            ],
          ],
        },
      ],
    },
  },

  // Layouts
  {
    id: "two-column",
    name: "Two Column Layout",
    description: "Responsive two-column content layout",
    category: "layout",
    data: {
      type: "row",
      style: { gap: "lg", padding: "md" },
      children: [
        {
          type: "column",
          style: { gap: "md" },
          children: [
            { type: "heading", text: "Main Content", level: 2 },
            {
              type: "text",
              content:
                "This is the primary content area. It can contain any type of content including text, images, and interactive elements.",
              priority: "normal",
            },
            {
              type: "button",
              label: "Learn More",
              variant: "primary",
            },
          ],
        },
        {
          type: "column",
          style: { gap: "md" },
          children: [
            { type: "heading", text: "Sidebar", level: 3 },
            {
              type: "list",
              items: [
                "Quick Links",
                "Related Cases",
                "Recent Updates",
                "Resources",
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "tabs-layout",
    name: "Tabbed Interface",
    description: "Multi-tab content organization",
    category: "layout",
    data: {
      type: "tabs",
      tabs: [
        {
          label: "Overview",
          content: {
            type: "container",
            style: { padding: "md", gap: "sm" },
            children: [
              { type: "heading", text: "Case Overview", level: 3 },
              {
                type: "text",
                content: "Summary of the current case status and key findings.",
                priority: "normal",
              },
            ],
          },
        },
        {
          label: "Evidence",
          content: {
            type: "list",
            items: [
              "Physical evidence collected",
              "Digital records analyzed",
              "Witness testimonies recorded",
            ],
          },
        },
        {
          label: "Timeline",
          content: {
            type: "table",
            columns: ["Date", "Event"],
            rows: [
              ["Jan 10", "Case opened"],
              ["Jan 12", "Initial investigation"],
              ["Jan 15", "Key evidence found"],
            ],
          },
        },
      ],
    },
  },
];

export function getTemplatesByCategory(
  category: Template["category"],
): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

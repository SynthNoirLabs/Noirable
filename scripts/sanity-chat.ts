import { getToolOutputFromSse } from "../src/lib/sanity/sse";

const defaultPrompt =
  'Create a UI card for a missing person with title "Missing: Jane Doe" and description "Last seen near the docks".';

const url =
  process.env.SANITY_URL || process.argv[2] || "http://localhost:3000/api/chat";
const prompt =
  process.env.SANITY_PROMPT || process.argv.slice(3).join(" ") || defaultPrompt;

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: prompt }],
  }),
});

const text = await response.text();

if (!response.ok) {
  console.error(`Sanity failed: ${response.status} ${response.statusText}`);
  console.error(text);
  process.exit(1);
}

const output = getToolOutputFromSse(text, "generate_ui");

if (!output) {
  console.error("Sanity failed: tool output not found in response.");
  process.exit(1);
}

console.log("Sanity OK: tool output found.");

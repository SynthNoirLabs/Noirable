import { describe, it, expect } from "vitest";
import { getToolOutputFromSse } from "./sse";

describe("getToolOutputFromSse", () => {
  it("returns output for a matching tool call", () => {
    const sse = [
      'data: {"type":"start"}',
      'data: {"type":"tool-input-available","toolCallId":"call_1","toolName":"generate_ui","input":{"instruction":"make card"}}',
      'data: {"type":"tool-output-available","toolCallId":"call_1","output":{"type":"text","content":"ok","_status":"generated"}}',
      "data: [DONE]",
    ].join("\n");

    const output = getToolOutputFromSse(sse, "generate_ui");

    expect(output).toEqual({
      type: "text",
      content: "ok",
      _status: "generated",
    });
  });
});

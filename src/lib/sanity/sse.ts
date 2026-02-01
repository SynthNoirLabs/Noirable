type SseEvent = {
  type?: string;
  toolCallId?: string;
  toolName?: string;
  output?: unknown;
};

function parseSseEvents(sseText: string): SseEvent[] {
  return sseText
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice("data: ".length).trim())
    .filter((data) => data !== "[DONE]" && data.length > 0)
    .flatMap((data) => {
      try {
        return [JSON.parse(data) as SseEvent];
      } catch {
        return [];
      }
    });
}

export function getToolOutputFromSse(sseText: string, toolName: string): unknown | null {
  const events = parseSseEvents(sseText);
  const toolCallIds = new Set(
    events
      .filter(
        (event) =>
          event.type === "tool-input-available" &&
          event.toolName === toolName &&
          typeof event.toolCallId === "string"
      )
      .map((event) => event.toolCallId as string)
  );

  for (const event of events) {
    if (
      event.type === "tool-output-available" &&
      event.toolCallId &&
      toolCallIds.has(event.toolCallId)
    ) {
      return event.output ?? null;
    }
  }

  return null;
}

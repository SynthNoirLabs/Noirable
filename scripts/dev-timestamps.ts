/**
 * `next dev` with a timestamp prefixed to every log line, for debugging.
 *
 * Next's dev logger doesn't print timestamps, so it's hard to tell how long a
 * request actually took or when something happened. This wrapper spawns the
 * normal dev server and rewrites each output line to:
 *
 *   [HH:MM:SS.mmm]  GET /api/images/… 200 in 11.1s (compile: 1004ms, render: 10.0s)
 *
 * Usage: `pnpm dev:ts` (or pass extra flags: `pnpm dev:ts --turbo`). Any args
 * after the script are forwarded to `next dev` verbatim, so `--webpack`,
 * `--turbo`, `-p 3001`, etc. all work.
 */
import { spawn } from "node:child_process";
import process from "node:process";

/** Local wall-clock as HH:MM:SS.mmm (24h), dim-grey via ANSI so it doesn't
 *  drown out Next's own colored output. */
function stamp(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  const t = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
  return `\x1b[2m[${t}]\x1b[0m `;
}

// Default to the project's standard webpack dev mode; forward any extra CLI args.
const extraArgs = process.argv.slice(2);
const nextArgs = ["dev", ...(extraArgs.length > 0 ? extraArgs : ["--webpack"])];

const child = spawn("next", nextArgs, {
  // Inherit stdin (so Ctrl-C / interactive prompts work); pipe stdout/stderr so
  // we can prefix each line.
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

/** Prefix every COMPLETE line on a stream; buffer partial lines across chunks
 *  so a timestamp never lands mid-line. Blank lines are passed through bare. */
function prefixStream(source: NodeJS.ReadableStream, sink: NodeJS.WriteStream): void {
  let buffer = "";
  source.setEncoding("utf8");
  source.on("data", (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    // Keep the last (possibly partial) segment in the buffer until its newline.
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      sink.write(line.length > 0 ? `${stamp()}${line}\n` : "\n");
    }
  });
  const flushRemaining = () => {
    if (buffer.length > 0) {
      sink.write(`${stamp()}${buffer}\n`);
      buffer = "";
    }
  };
  // Flush a trailing partial line on BOTH end and close — on an abrupt teardown
  // (Ctrl-C) the stream often emits `close` without a final `end`.
  source.on("end", flushRemaining);
  source.on("close", flushRemaining);
}

if (child.stdout) prefixStream(child.stdout, process.stdout);
if (child.stderr) prefixStream(child.stderr, process.stderr);

// Mirror the child's exit so `pnpm dev:ts` behaves like `next dev`.
child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

// Forward termination signals so Ctrl-C tears the server down cleanly.
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => child.kill(sig));
}

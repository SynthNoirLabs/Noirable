"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getAestheticCopy } from "@/lib/aesthetic/identity";
import type { ComponentProps } from "../internal/context";
import { useResolve, useBaseAestheticId } from "../internal/binding";

export function AudioPlayerRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const audio = component as SurfaceComponent & {
    url?: unknown;
    description?: unknown;
    speaker?: unknown;
  };
  const url = String(resolve(audio.url) ?? "");
  const description = audio.description ? String(resolve(audio.description)) : undefined;
  const speaker = audio.speaker ? String(resolve(audio.speaker)) : undefined;

  if (!url) {
    return (
      <div className="border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3 rounded-sm text-xs font-mono text-[var(--aesthetic-text)]/70 uppercase">
        {getAestheticCopy(baseAestheticId).audioPending}
      </div>
    );
  }

  // A real source plays directly; anything else is a STATEMENT SCRIPT the
  // model wrote — rendered on demand through TTS in the speaker's voice
  // variation (witness statements).
  const isPlayable =
    url.startsWith("/") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:");

  if (!isPlayable) {
    return (
      <StatementPlayer
        script={url}
        description={description}
        speaker={speaker}
        aestheticId={baseAestheticId}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {description && (
        <span className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-[var(--aesthetic-text)]/60">
          {description}
        </span>
      )}
      <audio src={url} controls aria-label={description} className="w-full" />
    </div>
  );
}

/** Deterministic 0..1 from a string — drives per-speaker voice variation. */
function speakerHash01(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

/**
 * Witness statement player — an LLM-written script read aloud on demand
 * through the existing TTS pipeline. Each named speaker gets a deterministic
 * prosody variation (stability/style/speed offsets hashed from the name) so
 * different witnesses are audibly different people on the same world voice.
 */
function StatementPlayer({
  script,
  description,
  speaker,
  aestheticId,
}: {
  script: string;
  description?: string;
  speaker?: string;
  aestheticId?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "failed">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = async () => {
    if (status === "loading") return;
    if (status === "playing") {
      audioRef.current?.pause();
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const h = speaker ? speakerHash01(speaker) : 0.5;
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: script,
          aestheticId,
          // Per-speaker variation around the world's voice direction.
          ...(speaker
            ? {
                voiceSettings: {
                  stability: 0.25 + h * 0.5,
                  style: 0.2 + ((h * 7) % 1) * 0.6,
                  speed: 0.85 + ((h * 13) % 1) * 0.3,
                },
              }
            : {}),
        }),
      });
      if (!response.ok) throw new Error("TTS failed");
      const buffer = await response.arrayBuffer();
      const blobUrl = URL.createObjectURL(new Blob([buffer], { type: "audio/mpeg" }));
      const element = new Audio(blobUrl);
      audioRef.current = element;
      element.onended = () => {
        URL.revokeObjectURL(blobUrl);
        setStatus("idle");
      };
      element.onpause = () => setStatus("idle");
      await element.play();
      setStatus("playing");
    } catch {
      setStatus("failed");
    }
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <div className="flex flex-col gap-1.5 rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3">
      <span className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-[var(--aesthetic-text)]/60">
        {description ?? (speaker ? `Statement — ${speaker}` : "Recorded statement")}
      </span>
      <p className="font-mono text-[11px] italic leading-relaxed text-[var(--aesthetic-text)]/55 line-clamp-3">
        “{script}”
      </p>
      <button
        type="button"
        onClick={() => void play()}
        aria-label={status === "playing" ? "Stop the statement" : "Play the statement"}
        className="inline-flex w-fit items-center gap-1.5 rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-accent)]/10 px-3 py-1.5 font-typewriter text-[11px] uppercase tracking-wider text-[var(--aesthetic-accent)] transition-colors hover:bg-[var(--aesthetic-accent)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
      >
        {status === "playing" ? (
          <Pause className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Play className="h-3.5 w-3.5" aria-hidden />
        )}
        {status === "loading"
          ? "Developing…"
          : status === "playing"
            ? "Stop"
            : status === "failed"
              ? "Retry statement"
              : "Play statement"}
      </button>
    </div>
  );
}

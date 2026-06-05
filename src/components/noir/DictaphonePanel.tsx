"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  Trash2,
  VolumeX,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useResolvedAesthetic } from "@/lib/aesthetic/useResolvedAesthetic";
import { getAestheticCopy } from "@/lib/aesthetic/identity";

interface Tape {
  id: string;
  text: string;
  hash: string;
  createdAt: number;
}

interface DictaphonePanelProps {
  tapes: Tape[];
  onDeleteTape: (hash: string) => void;
  onClose?: () => void;
}

export function DictaphonePanel({ tapes = [], onDeleteTape, onClose }: DictaphonePanelProps) {
  const [selectedTapeIndex, setSelectedTapeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [vuValue, setVuValue] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { baseId } = useResolvedAesthetic();
  const copy = getAestheticCopy(baseId);

  // Keep the selection in range when tapes are deleted: if the list shrinks
  // below the selected index, clamp to the last remaining tape so the deck
  // never shows "NO TAPE MOUNTED" while tapes still exist. Reconcile during
  // render (the sanctioned "adjust state when props change" pattern, as used by
  // the prevActiveTapeId block below) rather than in an effect.
  if (tapes.length === 0) {
    if (selectedTapeIndex !== 0) setSelectedTapeIndex(0);
  } else if (selectedTapeIndex > tapes.length - 1) {
    setSelectedTapeIndex(tapes.length - 1);
  }

  const activeTape = useMemo<Tape | null>(() => {
    if (selectedTapeIndex >= 0 && selectedTapeIndex < tapes.length) {
      return tapes[selectedTapeIndex];
    }
    return null;
  }, [tapes, selectedTapeIndex]);

  // Derived state to handle active tape changes synchronously during render
  const [prevActiveTapeId, setPrevActiveTapeId] = useState<string | null>(null);
  const currentActiveTapeId = activeTape?.id ?? null;
  if (currentActiveTapeId !== prevActiveTapeId) {
    setPrevActiveTapeId(currentActiveTapeId);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
  }

  const currentVuValue = isPlaying && !isPaused ? vuValue : 0;

  // Sync VU meter needle movement when playing
  useEffect(() => {
    if (!isPlaying || isPaused) {
      return;
    }
    const interval = setInterval(() => {
      // Fluctuates between 0.15 and 0.90 simulating speech audio
      setVuValue(0.15 + Math.random() * 0.75);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  // Clean up audio when active tape changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [activeTape]);

  const handlePlayPause = () => {
    if (!activeTape) return;

    if (isPlaying && !isPaused) {
      // Pause
      audioRef.current?.pause();
      setIsPaused(true);
    } else if (isPaused && audioRef.current) {
      // Resume
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
        setIsPaused(false);
      });
      setIsPaused(false);
    } else {
      // Start fresh — pause any prior instance so it doesn't keep playing.
      audioRef.current?.pause();

      const audio = new Audio(`/api/tts/file/${activeTape.hash}.mp3`);
      audio.muted = isMuted;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentTime(0);
      };

      // If the recording is missing/expired (404) or autoplay is blocked, the
      // play() promise rejects — reset state so the deck doesn't stay stuck
      // "playing" with no audio and no way to recover but Stop.
      audio.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentTime(0);
      };

      setIsPlaying(true);
      setIsPaused(false);
      audio.play().catch(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentTime(0);
      });
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
  };

  const handlePrev = () => {
    if (selectedTapeIndex > 0) {
      setSelectedTapeIndex(selectedTapeIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedTapeIndex < tapes.length - 1) {
      setSelectedTapeIndex(selectedTapeIndex + 1);
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  // Convert seconds to MM:SS format
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Calculate VU Needle Angle (-60deg to +60deg)
  const needleAngle = useMemo(() => {
    const angle = currentVuValue * 120 - 60;
    const rad = (angle * Math.PI) / 180;
    return {
      x2: 50 + 36 * Math.sin(rad),
      y2: 48 - 36 * Math.cos(rad),
    };
  }, [currentVuValue]);

  return (
    <div className="flex flex-col h-full bg-[var(--aesthetic-background)] text-[var(--aesthetic-text)] select-none border-l border-[var(--aesthetic-border)]/30 font-typewriter">
      {/* Header */}
      <div className="p-4 border-b border-[var(--aesthetic-border)]/20 flex justify-between items-center bg-[var(--aesthetic-surface)]/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--aesthetic-accent)] animate-pulse" />
          <h2 className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--aesthetic-text)]/80">
            {copy.dictaphoneTitle}
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--aesthetic-text)]/40 hover:text-[var(--aesthetic-accent)] text-xs uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Main Hardware Deck Layout */}
      <div className="p-6 flex flex-col items-center gap-6 border-b border-[var(--aesthetic-border)]/15 bg-gradient-to-b from-[var(--aesthetic-surface)]/30 to-transparent">
        {/* Steel Deck Plate */}
        <div className="w-full max-w-sm rounded border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-surface)] p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8),0_10px_20px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col items-center gap-4">
          <div className="absolute inset-0 bg-venetian opacity-[0.08] pointer-events-none" />

          {/* Cassette Slot & Spinning Reels */}
          <div className="w-full h-28 rounded border border-black bg-[#0d0d0f] shadow-[inset_0_2px_8px_rgba(0,0,0,1)] relative flex justify-around items-center p-4">
            {/* Cassette Label Tape */}
            {activeTape && (
              <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-[var(--aesthetic-accent)]/10 border border-[var(--aesthetic-accent)]/20 px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-wider text-[var(--aesthetic-accent)]/80 max-w-[80%] truncate">
                {activeTape.text.slice(0, 32)}...
              </div>
            )}

            {/* Left Reel Spool */}
            <div className="w-16 h-16 rounded-full border-2 border-[var(--aesthetic-border)]/35 bg-[#121214] flex items-center justify-center relative">
              <div
                className={cn(
                  "w-12 h-12 rounded-full border border-dashed border-[var(--aesthetic-text)]/30 relative flex items-center justify-center transition-transform",
                  isPlaying && !isPaused && "animate-spin"
                )}
                style={{ animationDuration: "6s" }}
              >
                <div className="w-2 h-2 rounded-full bg-black border border-[var(--aesthetic-border)]" />
                <div className="absolute w-1 h-3 bg-[var(--aesthetic-text)]/20 top-0" />
                <div className="absolute w-1 h-3 bg-[var(--aesthetic-text)]/20 bottom-0" />
                <div className="absolute h-1 w-3 bg-[var(--aesthetic-text)]/20 left-0" />
                <div className="absolute h-1 w-3 bg-[var(--aesthetic-text)]/20 right-0" />
              </div>
            </div>

            {/* Right Reel Spool */}
            <div className="w-16 h-16 rounded-full border-2 border-[var(--aesthetic-border)]/35 bg-[#121214] flex items-center justify-center relative">
              <div
                className={cn(
                  "w-12 h-12 rounded-full border border-dashed border-[var(--aesthetic-text)]/30 relative flex items-center justify-center transition-transform",
                  isPlaying && !isPaused && "animate-spin"
                )}
                style={{ animationDuration: "6s" }}
              >
                <div className="w-2 h-2 rounded-full bg-black border border-[var(--aesthetic-border)]" />
                <div className="absolute w-1 h-3 bg-[var(--aesthetic-text)]/20 top-0" />
                <div className="absolute w-1 h-3 bg-[var(--aesthetic-text)]/20 bottom-0" />
                <div className="absolute h-1 w-3 bg-[var(--aesthetic-text)]/20 left-0" />
                <div className="absolute h-1 w-3 bg-[var(--aesthetic-text)]/20 right-0" />
              </div>
            </div>
          </div>

          {/* VU Meter & Red LED Counter */}
          <div className="w-full flex justify-between items-center gap-4 px-2">
            {/* VU Meter (Analog Needle) */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-28 h-14 border border-black bg-[#101012] rounded-sm p-1 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                <svg className="w-24 h-12 text-[var(--aesthetic-text)]" viewBox="0 0 100 50">
                  {/* Curved Scale Arc */}
                  <path
                    d="M 15 45 A 35 35 0 0 1 85 45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="2 3"
                    className="opacity-45"
                  />
                  {/* Normal/Red Zones */}
                  <path
                    d="M 65 19 A 35 35 0 0 1 85 45"
                    fill="none"
                    stroke="red"
                    strokeWidth="1.5"
                  />
                  {/* Fluctuating Needle */}
                  <line
                    x1="50"
                    y1="48"
                    x2={needleAngle.x2}
                    y2={needleAngle.y2}
                    stroke={currentVuValue > 0.75 ? "red" : "var(--aesthetic-accent)"}
                    strokeWidth="1.8"
                    className="origin-[50px_48px] transition-transform duration-75"
                  />
                  <circle cx="50" cy="48" r="3.5" fill="#333" />
                </svg>
                <div className="absolute bottom-0.5 text-[8px] tracking-wider uppercase text-[var(--aesthetic-text)]/40 font-mono">
                  VU LEVEL
                </div>
              </div>
            </div>

            {/* Red LED Timer Counter (7-Segment look) */}
            <div className="flex flex-col items-end gap-1">
              <div className="bg-[#0c0505] border border-black text-[#ff2222] font-mono font-bold text-lg px-3 py-1.5 rounded-sm tracking-widest shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_0_8px_rgba(255,34,34,0.15)] select-none">
                {formatTime(currentTime)}
              </div>
              <div className="text-[8px] uppercase tracking-wider text-[var(--aesthetic-text)]/35 mr-1 font-mono">
                Tape Index Time
              </div>
            </div>
          </div>

          {/* Subtitle / Loaded tape info */}
          <div className="w-full text-center border-t border-[var(--aesthetic-border)]/15 pt-3">
            <span className="text-[10px] text-[var(--aesthetic-text)]/50 tracking-wider block uppercase">
              {activeTape
                ? `${copy.dictaphoneItemLabel} #${selectedTapeIndex + 1}`
                : "NO TAPE MOUNTED"}
            </span>
            <span className="text-[11px] text-[var(--aesthetic-text)]/85 truncate block mt-0.5 px-2">
              {activeTape ? activeTape.text.slice(0, 48) : copy.dictaphoneEmptyHint}
            </span>
          </div>
        </div>

        {/* Vintage Hardware Keys Panel */}
        <div className="flex items-center gap-2 border border-[var(--aesthetic-border)]/35 bg-[var(--aesthetic-surface)]/70 px-4 py-3 rounded shadow-md relative">
          <button
            type="button"
            onClick={handlePrev}
            disabled={selectedTapeIndex <= 0}
            className="w-10 h-10 flex items-center justify-center rounded border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)] text-[var(--aesthetic-text)]/65 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50 disabled:opacity-30 disabled:pointer-events-none transition-colors active:bg-[var(--aesthetic-surface)]"
            title="Previous Tape"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* PLAY/PAUSE */}
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={!activeTape}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded border transition-colors active:bg-[var(--aesthetic-surface)]",
              isPlaying && !isPaused
                ? "bg-[var(--aesthetic-accent)]/15 border-[var(--aesthetic-accent)]/60 text-[var(--aesthetic-accent)] shadow-[0_0_10px_color-mix(in_srgb,var(--aesthetic-accent)_20%,transparent)]"
                : "border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)] text-[var(--aesthetic-text)]/80 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50",
              !activeTape && "opacity-35 pointer-events-none"
            )}
            title={isPlaying && !isPaused ? "Pause Speech" : "Play Speech"}
          >
            {isPlaying && !isPaused ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* STOP */}
          <button
            type="button"
            onClick={handleStop}
            disabled={!isPlaying}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)] text-[var(--aesthetic-text)]/65 hover:text-[var(--aesthetic-error)] hover:border-[var(--aesthetic-error)]/50 transition-colors active:bg-[var(--aesthetic-surface)]",
              !isPlaying && "opacity-35 pointer-events-none"
            )}
            title="Stop & Rewind"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={selectedTapeIndex >= tapes.length - 1}
            className="w-10 h-10 flex items-center justify-center rounded border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)] text-[var(--aesthetic-text)]/65 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50 disabled:opacity-30 disabled:pointer-events-none transition-colors active:bg-[var(--aesthetic-surface)]"
            title="Next Tape"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-[var(--aesthetic-border)]/20 mx-1" />

          {/* MUTE */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded border border-[var(--aesthetic-border)]/30 transition-colors",
              isMuted
                ? "bg-[var(--aesthetic-error)]/10 border-[var(--aesthetic-error)]/40 text-[var(--aesthetic-error)]"
                : "bg-[var(--aesthetic-background)] text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
            )}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Cassette Rack Cabinet (Tape List) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        <span className="text-[10px] text-[var(--aesthetic-text)]/40 tracking-[0.2em] font-semibold uppercase block mb-1">
          Archived Tape Cassettes ({tapes.length})
        </span>

        {tapes.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[var(--aesthetic-border)]/35 rounded-sm p-4 text-xs text-[var(--aesthetic-text)]/45 leading-relaxed uppercase">
            No cassettes recorded.
            <span className="block text-[10px] mt-2 text-[var(--aesthetic-accent)]/60 normal-case tracking-normal">
              Click play on a chat message to voice-record a tape.
            </span>
          </div>
        ) : (
          <div className="grid gap-2">
            {tapes.map((tape, idx) => {
              const isSelected = selectedTapeIndex === idx;
              return (
                <div
                  key={tape.hash}
                  className={cn(
                    "border transition-all duration-200 rounded-sm p-3 relative group flex items-start justify-between gap-3 cursor-pointer",
                    isSelected
                      ? "bg-[var(--aesthetic-accent)]/5 border-[var(--aesthetic-accent)]/45 shadow-[0_0_8px_color-mix(in_srgb,var(--aesthetic-accent)_10%,transparent)]"
                      : "bg-[var(--aesthetic-surface)]/40 border-[var(--aesthetic-border)]/40 hover:border-[var(--aesthetic-border)]/75 hover:bg-[var(--aesthetic-surface)]/60"
                  )}
                  onClick={() => setSelectedTapeIndex(idx)}
                >
                  {/* Decorative hardware corner brackets for selected tape */}
                  {isSelected && (
                    <>
                      <div className="absolute w-1.5 h-1.5 top-[-1px] left-[-1px] border-t border-l border-[var(--aesthetic-accent)]/80" />
                      <div className="absolute w-1.5 h-1.5 bottom-[-1px] right-[-1px] border-b border-r border-[var(--aesthetic-accent)]/80" />
                    </>
                  )}

                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-[9px] uppercase tracking-widest block font-bold",
                        isSelected
                          ? "text-[var(--aesthetic-accent)]"
                          : "text-[var(--aesthetic-text)]/45"
                      )}
                    >
                      {copy.dictaphoneItemLabel} #{idx + 1}
                    </span>
                    <span className="text-[11px] text-[var(--aesthetic-text)]/85 truncate block mt-0.5 font-medium leading-tight">
                      {tape.text}
                    </span>
                    <span className="text-[8px] text-[var(--aesthetic-text)]/35 block mt-1.5 font-mono">
                      RECORDED: {new Date(tape.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) handleStop();
                      onDeleteTape(tape.hash);
                    }}
                    title={`${copy.dictaphoneDeleteLabel} (Delete)`}
                    className="text-[var(--aesthetic-text)]/30 hover:text-[var(--aesthetic-error)] transition-colors p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

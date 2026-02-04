import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  position: "left" | "right";
  size: number;
  min: number;
  max: number;
  defaultSize: number;
  onChange: (nextSize: number) => void;
  className?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ResizeHandle({
  position,
  size,
  min,
  max,
  defaultSize,
  onChange,
  className,
}: ResizeHandleProps) {
  const startXRef = useRef(0);
  const startSizeRef = useRef(0);
  const draggingRef = useRef(false);

  const direction = position === "right" ? 1 : -1;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    startXRef.current = event.clientX;
    startSizeRef.current = size;
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const delta = event.clientX - startXRef.current;
    const next = clamp(startSizeRef.current + delta * direction, min, max);
    onChange(next);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  const handleDoubleClick = () => {
    onChange(defaultSize);
  };

  return (
    <div
      role="separator"
      aria-label="Resize panel"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={size}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "absolute top-0 bottom-0 w-2 cursor-col-resize z-20 group",
        position === "right" ? "-right-1" : "-left-1",
        className
      )}
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--aesthetic-border)]/40 group-hover:bg-[var(--aesthetic-accent)]/60 transition-colors" />
    </div>
  );
}

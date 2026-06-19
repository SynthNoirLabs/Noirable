"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getAestheticCopy } from "@/lib/aesthetic/identity";
import { PhotoDeveloper } from "@/components/noir/PhotoDeveloper";
import type { ComponentProps } from "../internal/context";
import { useResolve, useBaseAestheticId } from "../internal/binding";

export function ImageRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const img = component as SurfaceComponent & {
    url?: unknown;
    fit?: string;
    variant?: string;
    accessibility?: { label?: unknown };
  };

  const url = String(resolve(img.url) ?? "");
  const alt = img.accessibility?.label ? String(resolve(img.accessibility.label)) : "Image";

  if (!url) {
    return (
      <div className="border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3 rounded-sm text-xs font-mono text-[var(--aesthetic-text)]/70 uppercase">
        {getAestheticCopy(baseAestheticId).imagePending}
      </div>
    );
  }

  const caption = img.accessibility?.label ? String(resolve(img.accessibility.label)) : undefined;

  return (
    <PhotoDeveloper src={url} alt={alt} fit={img.fit} variant={img.variant} caption={caption} />
  );
}

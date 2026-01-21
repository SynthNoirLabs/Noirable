"use client";

import React from "react";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { A2UIRenderer } from "@/components/renderer/A2UIRenderer";

export default function PrintPage() {
  const { evidence, evidenceHistory, activeEvidenceId } = useA2UIStore();
  const activeEntry = evidenceHistory.find(
    (entry) => entry.id === activeEvidenceId,
  );
  const data = activeEntry?.data ?? evidence;

  return (
    <div className="min-h-screen bg-[#f6f2e9] text-[#1c1c1c] p-8 font-sans">
      <style>{`
        @media print {
          .print-hidden {
            display: none !important;
          }
          body {
            background: #ffffff;
          }
        }
      `}</style>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <header className="flex items-start justify-between border-b border-[#c7c1b6] pb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#8a7f6f]">
              Case File
            </div>
            <h1 className="text-2xl font-semibold tracking-wide">
              Evidence Report
            </h1>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="print-hidden px-3 py-2 border border-[#b7ae9f] text-xs uppercase tracking-widest"
          >
            Print
          </button>
        </header>

        {data ? (
          <A2UIRenderer data={data} />
        ) : (
          <div className="text-sm text-[#6b6256] uppercase tracking-widest">
            No evidence available.
          </div>
        )}
      </div>
    </div>
  );
}

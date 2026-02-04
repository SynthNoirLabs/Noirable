"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Volume2, Mic, Sparkles, Settings, Download } from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "profile" | "colors" | "audio" | "voice" | "effects" | "advanced";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "profile", label: "Profile", icon: <Settings className="w-4 h-4" /> },
  { id: "colors", label: "Colors", icon: <Palette className="w-4 h-4" /> },
  { id: "audio", label: "Audio", icon: <Volume2 className="w-4 h-4" /> },
  { id: "voice", label: "Voice", icon: <Mic className="w-4 h-4" /> },
  { id: "effects", label: "Effects", icon: <Sparkles className="w-4 h-4" /> },
  { id: "advanced", label: "Advanced", icon: <Download className="w-4 h-4" /> },
];

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomizationPanel({ isOpen, onClose }: CustomizationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[var(--aesthetic-background)] border-l border-[var(--aesthetic-border)]/30 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--aesthetic-border)]/20">
              <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--aesthetic-text)]">
                Customization
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-sm hover:bg-[var(--aesthetic-surface)] transition-colors text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-text)]"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--aesthetic-border)]/20 overflow-x-auto scrollbar-none">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono uppercase tracking-wide transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-[var(--aesthetic-accent)] border-b-2 border-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/5"
                      : "text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-text)] hover:bg-[var(--aesthetic-surface)]/50"
                  )}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderTabContent(activeTab)}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function renderTabContent(tabId: TabId): React.ReactNode {
  // Placeholder content - will be replaced with actual components
  const placeholders: Record<TabId, { title: string; description: string }> = {
    profile: {
      title: "Profile Management",
      description:
        "Create, edit, and manage your custom profiles. Clone existing aesthetics as starting points.",
    },
    colors: {
      title: "Color Customization",
      description:
        "Adjust all 9 color tokens to personalize your theme. Changes preview in real-time.",
    },
    audio: {
      title: "Audio Settings",
      description: "Control volumes for SFX, music, and ambient sounds. Add custom audio sources.",
    },
    voice: {
      title: "Voice Settings",
      description:
        "Select your preferred voice and adjust TTS parameters like stability and speed.",
    },
    effects: {
      title: "Visual Effects",
      description: "Fine-tune rain, fog, and crackle intensities. Control typewriter speed.",
    },
    advanced: {
      title: "Advanced Settings",
      description: "Manage API keys, export/import settings, and configure image generation style.",
    },
  };

  const content = placeholders[tabId];

  return (
    <div className="space-y-4">
      <div className="text-center py-8 px-4">
        <h3 className="text-lg font-mono text-[var(--aesthetic-text)] mb-2">{content.title}</h3>
        <p className="text-sm text-[var(--aesthetic-text-muted)]">{content.description}</p>
      </div>
      <div className="border border-dashed border-[var(--aesthetic-border)]/30 rounded-sm p-8 text-center">
        <span className="text-xs font-mono text-[var(--aesthetic-text-muted)]/50 uppercase">
          Coming Soon
        </span>
      </div>
    </div>
  );
}

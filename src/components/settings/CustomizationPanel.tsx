"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import {
  X,
  Palette,
  Volume2,
  Mic,
  Sparkles,
  Settings,
  Download,
  Brain,
  Key,
  Type,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { ProfileSelector } from "./ProfileSelector";
import { ThemeGenerator } from "./ThemeGenerator";
import { ColorCustomization } from "./ColorCustomization";
import { FontCustomization } from "./FontCustomization";
import { PersonaCustomization } from "./PersonaCustomization";
import { AudioCustomization } from "./AudioCustomization";
import { VoiceCustomization } from "./VoiceCustomization";
import { EffectsCustomization } from "./EffectsCustomization";
import { ImageStyleCustomization } from "./ImageStyleCustomization";
import { ApiKeyManager } from "./ApiKeyManager";
import { ProfilePortability } from "./ProfilePortability";

type TabId =
  | "profile"
  | "generate"
  | "colors"
  | "fonts"
  | "persona"
  | "audio"
  | "voice"
  | "effects"
  | "imageStyle"
  | "portability"
  | "advanced";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "profile", label: "Profile", icon: <Settings className="w-4 h-4" /> },
  { id: "generate", label: "Generate", icon: <Wand2 className="w-4 h-4" /> },
  { id: "colors", label: "Colors", icon: <Palette className="w-4 h-4" /> },
  { id: "fonts", label: "Fonts", icon: <Type className="w-4 h-4" /> },
  { id: "persona", label: "Persona", icon: <Brain className="w-4 h-4" /> },
  { id: "audio", label: "Audio", icon: <Volume2 className="w-4 h-4" /> },
  { id: "voice", label: "Voice", icon: <Mic className="w-4 h-4" /> },
  { id: "effects", label: "Effects", icon: <Sparkles className="w-4 h-4" /> },
  { id: "imageStyle", label: "Image Style", icon: <ImageIcon className="w-4 h-4" /> },
  { id: "portability", label: "Portability", icon: <Download className="w-4 h-4" /> },
  { id: "advanced", label: "Advanced", icon: <Key className="w-4 h-4" /> },
];

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomizationPanel({ isOpen, onClose }: CustomizationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const panelRef = useRef<HTMLDivElement>(null);

  // Picking a WORLD is a commitment: auto-close the drawer (and its desk-
  // blurring scrim) so the arrival cinematic plays on a clean, visible desk
  // instead of behind a blurred backdrop. Editing the active profile's colors/
  // fonts/etc. doesn't change this key, so the Lab stays open while tuning.
  const aestheticId = useA2UIStore((state) => state.settings.aestheticId);
  const activeCustomProfileId = useCustomProfileStore((state) => state.activeCustomProfileId);
  const resolvedWorldKey = `${aestheticId}/${activeCustomProfileId ?? ""}`;
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const lastWorldKeyRef = useRef(resolvedWorldKey);
  useEffect(() => {
    const previous = lastWorldKeyRef.current;
    lastWorldKeyRef.current = resolvedWorldKey;
    if (previous !== resolvedWorldKey) {
      onCloseRef.current();
    }
  }, [resolvedWorldKey]);

  // Focus trap and Escape-to-close
  useFocusTrap(isOpen, panelRef);
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customization-panel-title"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[var(--aesthetic-background)] border-l border-[var(--aesthetic-border)]/30 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--aesthetic-border)]/20">
              <h2
                id="customization-panel-title"
                className="text-sm font-mono uppercase tracking-wider text-[var(--aesthetic-text)]"
              >
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
  switch (tabId) {
    case "profile":
      return <ProfileSelector />;
    case "generate":
      return <ThemeGenerator />;
    case "colors":
      return <ColorCustomization />;
    case "fonts":
      return <FontCustomization />;
    case "persona":
      return <PersonaCustomization />;
    case "audio":
      return <AudioCustomization />;
    case "voice":
      return <VoiceCustomization />;
    case "effects":
      return <EffectsCustomization />;
    case "imageStyle":
      return <ImageStyleCustomization />;
    case "portability":
      return <ProfilePortability />;
    case "advanced":
      return <ApiKeyManager />;
    default:
      return null;
  }
}

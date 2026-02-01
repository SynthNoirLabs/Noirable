import React from "react";
import { type ComponentRendererProps } from "../registry";
import { type Icon as IconNode } from "@/lib/a2ui/catalog/components";
import { getCommonStyles } from "../layout/utils";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

// Mapping from A2UI icon names (Material Design) to Lucide React
// This list covers the tokens in component.ts
const ICON_MAP: Record<string, keyof typeof LucideIcons> = {
  accountCircle: "UserCircle",
  add: "Plus",
  arrowBack: "ArrowLeft",
  arrowForward: "ArrowRight",
  attachFile: "Paperclip",
  calendarToday: "Calendar",
  call: "Phone",
  camera: "Camera",
  check: "Check",
  close: "X",
  delete: "Trash2",
  download: "Download",
  edit: "Edit2",
  event: "CalendarDays",
  error: "AlertCircle",
  fastForward: "FastForward",
  favorite: "Heart",
  favoriteOff: "HeartOff",
  folder: "Folder",
  help: "HelpCircle",
  home: "Home",
  info: "Info",
  locationOn: "MapPin",
  lock: "Lock",
  lockOpen: "Unlock",
  mail: "Mail",
  menu: "Menu",
  moreVert: "MoreVertical",
  moreHoriz: "MoreHorizontal",
  notificationsOff: "BellOff",
  notifications: "Bell",
  pause: "Pause",
  payment: "CreditCard",
  person: "User",
  phone: "Phone",
  photo: "Image",
  play: "Play",
  print: "Printer",
  refresh: "RefreshCw",
  rewind: "Rewind",
  search: "Search",
  send: "Send",
  settings: "Settings",
  share: "Share2",
  shoppingCart: "ShoppingCart",
  skipNext: "SkipForward",
  skipPrevious: "SkipBack",
  star: "Star",
  starHalf: "StarHalf",
  starOff: "StarOff",
  stop: "Square", // "Stop" might be reserved or CircleStop
  upload: "Upload",
  visibility: "Eye",
  visibilityOff: "EyeOff",
  volumeDown: "Volume1",
  volumeMute: "VolumeX",
  volumeOff: "Volume", // Volume is usually muted/off? Or generic.
  volumeUp: "Volume2",
  warning: "AlertTriangle",
};

// Helper to resolve dynamic string (basic)
const resolveText = (text: unknown): string => {
  if (typeof text === "string") return text;
  return "help"; // Default fallback
};

export const Icon: React.FC<ComponentRendererProps> = ({ node, theme = "noir" }) => {
  const iconNode = node as unknown as IconNode;
  const nodeAsRecord = node as unknown as Record<string, unknown>;

  const iconName = resolveText(iconNode.name);
  const lucideName = ICON_MAP[iconName] || "HelpCircle";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons[lucideName] || LucideIcons.HelpCircle) as React.ElementType;

  // Support style prop
  const style = nodeAsRecord.style;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        getCommonStyles({ style: style as Record<string, unknown> | undefined })
      )}
    >
      <IconComponent
        className={cn(
          "w-6 h-6",
          theme === "noir" ? "text-noir-paper" : "text-current",
          // Allow override via style.className
          typeof (style as Record<string, unknown> | undefined)?.className === "string"
            ? ((style as Record<string, unknown>).className as string)
            : undefined
        )}
      />
    </div>
  );
};

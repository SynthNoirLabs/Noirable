"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Book,
  BookOpen,
  Bookmark,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Cloud,
  Code,
  Cpu,
  Database,
  DollarSign,
  Download,
  Droplet,
  Edit3,
  ExternalLink,
  Eye,
  Feather,
  File,
  FileText,
  Flag,
  Flame,
  Folder,
  Heart,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Info,
  Key,
  Link as LinkIcon,
  Lock,
  Mail,
  MapPin,
  Mic,
  Minus,
  Moon,
  Music,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  Server,
  Settings,
  Shield,
  Skull,
  Star,
  Sun,
  Tag,
  Terminal,
  Trash2,
  TrendingDown,
  TrendingUp,
  Unlock,
  Upload,
  User,
  Users,
  Video,
  Volume2,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { useResolve } from "../internal/binding";

// Curated semantic-name → lucide glyph map. Keys are normalized (lowercase,
// non-alphanumerics stripped) so both `file-text` and `fileText`/`filetext`
// resolve to the same icon. Unmapped names fall back to HelpCircle.
const ICON_MAP: Record<string, LucideIcon> = {
  help: HelpCircle,
  search: Search,
  user: User,
  users: Users,
  file: File,
  filetext: FileText,
  folder: Folder,
  lock: Lock,
  unlock: Unlock,
  alert: AlertTriangle,
  alerttriangle: AlertTriangle,
  alertcircle: AlertCircle,
  check: Check,
  checkcircle: CheckCircle,
  x: X,
  info: Info,
  star: Star,
  heart: Heart,
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  clock: Clock,
  settings: Settings,
  home: Home,
  mappin: MapPin,
  camera: Camera,
  image: ImageIcon,
  eye: Eye,
  shield: Shield,
  key: Key,
  database: Database,
  server: Server,
  cpu: Cpu,
  wifi: Wifi,
  zap: Zap,
  activity: Activity,
  trendingup: TrendingUp,
  trendingdown: TrendingDown,
  dollarsign: DollarSign,
  tag: Tag,
  bookmark: Bookmark,
  flag: Flag,
  bell: Bell,
  download: Download,
  upload: Upload,
  trash: Trash2,
  edit: Edit3,
  plus: Plus,
  minus: Minus,
  arrowright: ArrowRight,
  arrowleft: ArrowLeft,
  chevronright: ChevronRight,
  externallink: ExternalLink,
  link: LinkIcon,
  play: Play,
  pause: Pause,
  music: Music,
  volume: Volume2,
  mic: Mic,
  video: Video,
  terminal: Terminal,
  code: Code,
  book: Book,
  bookopen: BookOpen,
  feather: Feather,
  skull: Skull,
  moon: Moon,
  sun: Sun,
  cloud: Cloud,
  droplet: Droplet,
  flame: Flame,
};

/** Normalize an incoming icon name: lowercase + strip non-alphanumerics. */
function normalizeIconName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Icon size variants — defaults to "medium" (the historical w-5 h-5). */
const ICON_SIZE_CLASS: Record<string, string> = {
  small: "w-4 h-4",
  medium: "w-5 h-5",
  large: "w-7 h-7",
};

export function IconRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const icon = component as SurfaceComponent & { name?: unknown; size?: unknown };
  const name = String(resolve(icon.name) ?? "help");
  const Glyph = ICON_MAP[normalizeIconName(name)] ?? HelpCircle;
  const size = typeof icon.size === "string" ? icon.size : "medium";
  return (
    <Glyph
      className={cn(
        ICON_SIZE_CLASS[size] ?? ICON_SIZE_CLASS.medium,
        "text-[var(--aesthetic-accent)]"
      )}
      aria-label={name}
      role="img"
    />
  );
}

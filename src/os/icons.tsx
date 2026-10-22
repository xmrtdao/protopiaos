import {
  FolderOpen, FileText, Sheet, NotebookPen, Settings, Sparkles, Globe, Image as ImageIcon, Folder, File, Trash2,
} from "lucide-react";
import type { AppId, FileKind } from "./store";
import { cn } from "@/lib/utils";

const appIcons: Record<AppId, typeof Folder> = {
  explorer: FolderOpen, writer: FileText, sheets: Sheet, notepad: NotebookPen,
  settings: Settings, welcome: Sparkles, browser: Globe, photos: ImageIcon,
};
const appTone: Record<AppId, string> = {
  explorer: "bg-chart-4/15 text-chart-4",
  writer: "bg-chart-1/15 text-chart-1",
  sheets: "bg-chart-2/15 text-chart-2",
  notepad: "bg-muted text-foreground",
  settings: "bg-muted text-foreground",
  welcome: "bg-primary/15 text-primary",
  browser: "bg-chart-3/15 text-chart-3",
  photos: "bg-chart-5/15 text-chart-5",
};

export function AppIcon({ app, size = 20, boxed = false, className }: { app: AppId; size?: number; boxed?: boolean; className?: string }) {
  const I = appIcons[app];
  if (!boxed) return <I size={size} className={cn(appTone[app].split(" ")[1], className)} />;
  return (
    <span className={cn("inline-flex items-center justify-center rounded-lg", appTone[app], className)} style={{ width: size * 1.8, height: size * 1.8 }}>
      <I size={size} />
    </span>
  );
}

export function FileIcon({ kind, size = 20, trash }: { kind: FileKind; size?: number; trash?: boolean }) {
  if (trash) return <Trash2 size={size} className="text-muted-foreground" />;
  if (kind === "folder") return <Folder size={size} className="fill-chart-3/40 text-chart-3" />;
  if (kind === "doc") return <FileText size={size} className="text-chart-1" />;
  if (kind === "sheet") return <Sheet size={size} className="text-chart-2" />;
  if (kind === "image") return <ImageIcon size={size} className="text-chart-5" />;
  return <File size={size} className="text-muted-foreground" />;
}

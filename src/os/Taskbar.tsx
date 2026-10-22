import { useEffect, useState } from "react";
import { Search, Wifi, Volume2, BatteryFull, ShieldCheck, Power, Lock } from "lucide-react";
import { useOs, APPS, type AppId } from "./store";
import { AppIcon, FileIcon } from "./icons";
import { cn } from "@/lib/utils";

const PINNED: AppId[] = ["explorer", "writer", "sheets", "browser", "settings"];
const START_APPS: AppId[] = ["explorer", "writer", "sheets", "notepad", "browser", "photos", "settings", "welcome"];

function Clock() {
  const [t, setT] = useState<Date | null>(null);
  useEffect(() => {
    setT(new Date());
    const i = setInterval(() => setT(new Date()), 15000);
    return () => clearInterval(i);
  }, []);
  if (!t) return null;
  return (
    <div className="text-right text-[11px] leading-tight">
      <div>{t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
      <div>{t.toLocaleDateString()}</div>
    </div>
  );
}

export function StartMenu({ onClose }: { onClose: () => void }) {
  const { open, fs, openFile, userName } = useOs();
  const [q, setQ] = useState("");
  const recent = fs.filter((f) => f.kind !== "folder" && f.parentId !== "trash").sort((a, b) => b.modified - a.modified);
  const apps = START_APPS.filter((a) => APPS[a].name.toLowerCase().includes(q.toLowerCase()));
  const files = q ? recent.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())) : recent.slice(0, 4);

  return (
    <div className="absolute bottom-14 left-1/2 z-[9999] flex w-[min(640px,calc(100vw-16px))] -translate-x-1/2 flex-col rounded-xl border acrylic shadow-flyout animate-pop" onPointerDown={(e) => e.stopPropagation()}>
      <div className="p-5 pb-3">
        <label className="flex items-center gap-2 rounded-full border bg-card px-4 py-2">
          <Search size={16} className="text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for apps, settings, and documents" className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>
      <div className="px-8">
        <h3 className="mb-2 text-sm font-semibold">Pinned</h3>
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-6">
          {apps.map((a) => (
            <button key={a} onClick={() => { open(a); onClose(); }} className="flex flex-col items-center gap-1.5 rounded-md p-2 hover:bg-hover">
              <AppIcon app={a} size={22} boxed />
              <span className="line-clamp-2 text-center text-[11px]">{APPS[a].name}</span>
            </button>
          ))}
        </div>
        <h3 className="mb-2 mt-4 text-sm font-semibold">{q ? "Documents" : "Recommended"}</h3>
        <div className="grid gap-1 pb-4 sm:grid-cols-2">
          {files.map((f) => (
            <button key={f.id} onClick={() => { openFile(f); onClose(); }} className="flex items-center gap-3 rounded-md p-2 text-left hover:bg-hover">
              <FileIcon kind={f.kind} size={22} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{f.name}</span>
                <span className="block text-[11px] text-muted-foreground">{new Date(f.modified).toLocaleDateString()}</span>
              </span>
            </button>
          ))}
          {!files.length && <p className="text-xs text-muted-foreground">No matching documents.</p>}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-b-xl border-t bg-muted/60 px-8 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{userName[0]}</span>
          {userName}
        </div>
        <div className="flex gap-1">
          <button aria-label="Lock" className="rounded-md p-2 hover:bg-hover" onClick={() => location.reload()}><Lock size={16} /></button>
          <button aria-label="Power" className="rounded-md p-2 hover:bg-hover" onClick={() => location.reload()}><Power size={16} /></button>
        </div>
      </div>
    </div>
  );
}

export function Taskbar({ startOpen, setStartOpen }: { startOpen: boolean; setStartOpen: (v: boolean) => void }) {
  const { windows, activeId, open, toggleMin } = useOs();
  const apps = Array.from(new Set([...PINNED, ...windows.map((w) => w.app)]));

  return (
    <div className="absolute inset-x-0 bottom-0 z-[9998] flex h-12 items-center border-t acrylic px-2" onPointerDown={(e) => e.stopPropagation()}>
      <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
        <ShieldCheck size={16} className="text-success" /> Private & protected
      </div>
      <div className="mx-auto flex items-center gap-0.5 overflow-x-auto">
        <button aria-label="Start" onClick={() => setStartOpen(!startOpen)} className={cn("flex h-10 w-10 items-center justify-center rounded-md hover:bg-hover", startOpen && "bg-hover")}>
          <span className="grid grid-cols-2 gap-0.5">
            {[0, 1, 2, 3].map((i) => <span key={i} className="h-2 w-2 rounded-[2px] bg-primary" />)}
          </span>
        </button>
        <button aria-label="Search" onClick={() => setStartOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-hover">
          <Search size={18} />
        </button>
        {apps.map((a) => {
          const wins = windows.filter((w) => w.app === a);
          const isActive = wins.some((w) => w.id === activeId && !w.min);
          return (
            <button
              key={a}
              title={APPS[a].name}
              onClick={() => (wins.length ? toggleMin(wins[wins.length - 1]!.id) : open(a))}
              className={cn("relative flex h-10 w-10 items-center justify-center rounded-md hover:bg-hover", isActive && "bg-hover")}
            >
              <AppIcon app={a} size={20} />
              {wins.length > 0 && <span className={cn("absolute bottom-0.5 h-[3px] rounded-full bg-primary transition-all", isActive ? "w-4" : "w-1.5 bg-muted-foreground")} />}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-hover">
        <div className="hidden gap-2 sm:flex"><Wifi size={15} /><Volume2 size={15} /><BatteryFull size={15} /></div>
        <Clock />
      </div>
    </div>
  );
}

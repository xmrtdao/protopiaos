import { useEffect, useState } from "react";
import { Save, ArrowLeft, ArrowRight, RotateCw, Lock, ShieldCheck, Check } from "lucide-react";
import { useOs, type AppId } from "../store";
import { AppIcon } from "../icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import wallpaper from "@/assets/wallpaper.jpg";

export function Notepad({ winId, fileId }: { winId: string; fileId?: string }) {
  const { fs, saveFile, createFile, update } = useOs();
  const file = fs.find((f) => f.id === fileId);
  const [text, setText] = useState(file?.content ?? "");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    update(winId, { title: `${dirty ? "*" : ""}${file?.name ?? "Untitled"} - Notepad` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.name, dirty]);
  const save = () => {
    if (file) saveFile(file.id, { content: text });
    else update(winId, { fileId: createFile("documents", "Untitled.txt", "text", text).id });
    setDirty(false);
  };
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-2 py-1"><Button size="sm" variant="ghost" onClick={save}><Save size={15} /> Save</Button></div>
      <textarea aria-label="Text" value={text} onChange={(e) => { setText(e.target.value); setDirty(true); }}
        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } }}
        className="flex-1 resize-none bg-card p-3 font-mono text-sm outline-none" />
    </div>
  );
}

export function Photos({ fileId }: { fileId?: string }) {
  const { fs } = useOs();
  const file = fs.find((f) => f.id === fileId);
  const src = file?.content?.startsWith("data:") ? file.content : wallpaper;
  return (
    <div className="flex h-full items-center justify-center bg-foreground/90 p-4">
      <img src={src} alt={file?.name ?? "Photo"} className="max-h-full max-w-full object-contain" />
    </div>
  );
}

export function Browser() {
  const [url, setUrl] = useState("https://www.wikipedia.org");
  const [input, setInput] = useState(url);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b bg-secondary px-2 py-1.5">
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Back"><ArrowLeft size={15} /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Forward"><ArrowRight size={15} /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Reload" onClick={() => setUrl(url + "")}><RotateCw size={15} /></Button>
        <form className="flex flex-1 items-center gap-2 rounded-full border bg-background px-3" onSubmit={(e) => { e.preventDefault(); const u = /^https?:\/\//.test(input) ? input : `https://duckduckgo.com/?q=${encodeURIComponent(input)}`; setUrl(u); setInput(u); }}>
          <Lock size={13} className="text-success" />
          <input aria-label="Address" value={input} onChange={(e) => setInput(e.target.value)} className="h-8 w-full bg-transparent text-xs outline-none" />
        </form>
        <span className="hidden items-center gap-1 px-2 text-[11px] text-success sm:flex"><ShieldCheck size={14} /> Trackers blocked</span>
      </div>
      <iframe key={url} src={url} title="Web page" className="flex-1 bg-card" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
    </div>
  );
}

const ACCENTS = [
  { name: "Ocean", v: "oklch(0.55 0.15 245)" },
  { name: "Forest", v: "oklch(0.55 0.13 155)" },
  { name: "Sunset", v: "oklch(0.62 0.17 45)" },
  { name: "Rose", v: "oklch(0.58 0.18 10)" },
  { name: "Slate", v: "oklch(0.42 0.03 250)" },
];

export function Settings() {
  const { userName, setUserName, accent, setAccent, fs } = useOs();
  const [tab, setTab] = useState("Personalization");
  const tabs = ["System", "Personalization", "Accounts", "Privacy & security", "About"];
  const files = fs.filter((f) => f.kind !== "folder").length;
  return (
    <div className="flex h-full bg-background text-sm">
      <nav className="hidden w-52 shrink-0 p-3 sm:block">
        <div className="mb-4 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{userName[0]}</span>
          <div><div className="font-medium">{userName}</div><div className="text-[11px] text-muted-foreground">Local account</div></div>
        </div>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-hover", tab === t && "bg-hover font-medium")}>
            {tab === t && <span className="absolute left-0 top-2 h-4 w-[3px] rounded bg-primary" />}{t}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-auto p-6">
        <select className="mb-4 w-full rounded-md border bg-card p-2 sm:hidden" value={tab} onChange={(e) => setTab(e.target.value)}>{tabs.map((t) => <option key={t}>{t}</option>)}</select>
        <h2 className="mb-5 text-2xl font-semibold">{tab}</h2>
        <div className="space-y-2">
          {tab === "Personalization" && (
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-3 font-medium">Accent color</div>
              <div className="flex flex-wrap gap-3">
                {ACCENTS.map((a) => (
                  <button key={a.name} title={a.name} aria-label={a.name} onClick={() => setAccent(a.v)} className="flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ring-offset-card" style={{ background: a.v, boxShadow: accent === a.v ? `0 0 0 2px ${a.v}` : undefined }}>
                    {accent === a.v && <Check size={16} className="text-primary-foreground" />}
                  </button>
                ))}
              </div>
            </div>
          )}
          {tab === "Accounts" && (
            <div className="rounded-lg border bg-card p-4">
              <label className="mb-2 block font-medium">Your name</label>
              <Input value={userName} onChange={(e) => setUserName(e.target.value || "User")} className="max-w-xs" />
            </div>
          )}
          {tab === "System" && [["Storage", `${files} files stored on this device`], ["Display", "Scale 100% · Recommended"], ["Sound", "Speakers · 60%"], ["Notifications", "On"]].map(([a, b]) => (
            <div key={a} className="rounded-lg border bg-card p-4"><div className="font-medium">{a}</div><div className="text-xs text-muted-foreground">{b}</div></div>
          ))}
          {tab === "Privacy & security" && [["Telemetry", "Off — nothing about you is sent anywhere"], ["Advertising ID", "Not present on this system"], ["Firewall", "Active · blocks unknown outbound connections"], ["Updates", "Signed & verified updates only"]].map(([a, b]) => (
            <div key={a} className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div><div className="font-medium">{a}</div><div className="text-xs text-muted-foreground">{b}</div></div>
              <ShieldCheck size={18} className="text-success" />
            </div>
          ))}
          {tab === "About" && (
            <div className="rounded-lg border bg-card p-4 text-xs leading-6">
              <div className="mb-1 text-base font-semibold">Protopia OS</div>
              Edition: Home · Version 1.0<br />A familiar, private desktop that respects you. No ads, no tracking, and your files stay yours.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SWAPS: { from: string; to: string; app: AppId }[] = [
  { from: "Microsoft Word", to: "Writer", app: "writer" },
  { from: "Microsoft Excel", to: "Sheets", app: "sheets" },
  { from: "File Explorer", to: "File Explorer", app: "explorer" },
  { from: "Notepad", to: "Notepad", app: "notepad" },
  { from: "Edge / Chrome", to: "Web Browser", app: "browser" },
  { from: "Windows Settings", to: "Settings", app: "settings" },
];

export function Welcome() {
  const { open, userName } = useOs();
  return (
    <div className="h-full overflow-auto bg-background p-6 sm:p-10">
      <p className="text-sm text-primary">Welcome, {userName}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">It works the way you're used to.</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Start menu at the bottom, windows you can drag, minimize and close, and your documents in familiar folders.
        Your Word and Excel files open here too.
      </p>
      <h2 className="mb-3 mt-8 text-sm font-semibold">Your Windows apps → their Protopia equivalent</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {SWAPS.map((s) => (
          <button key={s.from} onClick={() => open(s.app)} className="flex items-center gap-3 rounded-lg border bg-card p-3 text-left hover:border-primary">
            <AppIcon app={s.app} size={18} boxed />
            <span className="text-xs"><span className="block text-muted-foreground">{s.from}</span><span className="text-sm font-medium">{s.to}</span></span>
          </button>
        ))}
      </div>
      <div className="mt-8 rounded-xl border bg-accent p-5 text-accent-foreground">
        <h3 className="font-semibold">Bring your files with you</h3>
        <p className="mt-1 text-xs">Open File Explorer and choose “Import from this computer”, or simply drag files into any folder. Deleted files go to the Recycle Bin, so nothing is lost by accident.</p>
        <Button className="mt-4" onClick={() => open("explorer")}>Open File Explorer</Button>
      </div>
    </div>
  );
}

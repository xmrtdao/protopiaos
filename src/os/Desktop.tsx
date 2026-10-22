import { useState } from "react";
import { OsProvider, useOs, ROOTS, type Win } from "./store";
import { Window } from "./Window";
import { Taskbar, StartMenu } from "./Taskbar";
import { FileIcon, AppIcon } from "./icons";
import { Explorer } from "./apps/Explorer";
import { Writer } from "./apps/Writer";
import { Sheets } from "./apps/Sheets";
import { Notepad, Photos, Browser, Settings, Welcome } from "./apps/Misc";
import wallpaper from "@/assets/wallpaper.jpg";
import { cn } from "@/lib/utils";

function AppBody({ win }: { win: Win }) {
  switch (win.app) {
    case "explorer": return <Explorer startFolder={win.folderId} />;
    case "writer": return <Writer winId={win.id} fileId={win.fileId} />;
    case "sheets": return <Sheets winId={win.id} fileId={win.fileId} />;
    case "notepad": return <Notepad winId={win.id} fileId={win.fileId} />;
    case "photos": return <Photos fileId={win.fileId} />;
    case "browser": return <Browser />;
    case "settings": return <Settings />;
    case "welcome": return <Welcome />;
  }
}

function Shell() {
  const { windows, fs, open, openFile } = useOs();
  const [startOpen, setStartOpen] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const desktopFiles = fs.filter((f) => f.parentId === ROOTS.desktop);
  const trashCount = fs.filter((f) => f.parentId === ROOTS.trash).length;

  const icons = [
    { key: "pc", label: "This PC", el: <AppIcon app="explorer" size={34} />, act: () => open("explorer", { folderId: ROOTS.home }) },
    { key: "docs", label: "Documents", el: <FileIcon kind="folder" size={34} />, act: () => open("explorer", { folderId: ROOTS.documents }) },
    { key: "bin", label: "Recycle Bin", el: <FileIcon kind="folder" size={34} trash />, act: () => open("explorer", { folderId: ROOTS.trash }), badge: trashCount },
    { key: "writer", label: "Writer", el: <AppIcon app="writer" size={34} />, act: () => open("writer") },
    { key: "sheets", label: "Sheets", el: <AppIcon app="sheets" size={34} />, act: () => open("sheets") },
    ...desktopFiles.map((f) => ({ key: f.id, label: f.name, el: <FileIcon kind={f.kind} size={34} />, act: () => openFile(f) })),
  ];

  return (
    <main className="relative h-dvh w-full select-none overflow-hidden" onPointerDown={() => { setStartOpen(false); setSel(null); }}>
      <img src={wallpaper} alt="" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
      <h1 className="sr-only">Protopia OS desktop</h1>
      <div className="absolute left-2 top-2 flex max-h-[calc(100%-60px)] flex-col flex-wrap content-start gap-1">
        {icons.map((i) => (
          <button key={i.key} onPointerDown={(e) => { e.stopPropagation(); setSel(i.key); }} onDoubleClick={i.act}
            onKeyDown={(e) => e.key === "Enter" && i.act()}
            className={cn("relative flex w-20 flex-col items-center gap-1 rounded-md p-1.5 hover:bg-card/30", sel === i.key && "bg-card/50")}>
            {i.el}
            <span className="line-clamp-2 text-center text-[11px] text-foreground drop-shadow-sm">{i.label}</span>
          </button>
        ))}
      </div>
      {windows.map((w) => <Window key={w.id} win={w}><AppBody win={w} /></Window>)}
      {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
      <Taskbar startOpen={startOpen} setStartOpen={setStartOpen} />
    </main>
  );
}

export function Desktop() {
  return <OsProvider><Shell /></OsProvider>;
}

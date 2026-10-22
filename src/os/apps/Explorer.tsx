import { useRef, useState } from "react";
import { ArrowLeft, ArrowUp, Plus, Trash2, Upload, RotateCcw, Monitor, FileText, Image as ImageIcon, Download, Music, HardDrive } from "lucide-react";
import { useOs, ROOTS, type FsNode, type FileKind } from "../store";
import { FileIcon } from "../icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SIDEBAR = [
  { id: ROOTS.home, label: "This PC", icon: HardDrive },
  { id: ROOTS.desktop, label: "Desktop", icon: Monitor },
  { id: ROOTS.documents, label: "Documents", icon: FileText },
  { id: ROOTS.pictures, label: "Pictures", icon: ImageIcon },
  { id: ROOTS.downloads, label: "Downloads", icon: Download },
  { id: ROOTS.music, label: "Music", icon: Music },
  { id: ROOTS.trash, label: "Recycle Bin", icon: Trash2 },
];

const kindLabel: Record<FileKind, string> = { folder: "File folder", doc: "Document", sheet: "Spreadsheet", text: "Text file", image: "Picture" };

export function guessKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["doc", "docx", "odt", "rtf", "html"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "sheet";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(ext)) return "image";
  return "text";
}

export function Explorer({ startFolder }: { startFolder?: string | undefined }) {
  const { fs, openFile, createFile, trash, restore, emptyTrash } = useOs();
  const [history, setHistory] = useState<string[]>([startFolder ?? ROOTS.documents]);
  const [sel, setSel] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cwd = history[history.length - 1] ?? ROOTS.documents;
  const folder = fs.find((f) => f.id === cwd);
  const items = fs.filter((f) => f.parentId === cwd).sort((a, b) => (a.kind === "folder" ? -1 : 1) - (b.kind === "folder" ? -1 : 1) || a.name.localeCompare(b.name));
  const inTrash = cwd === ROOTS.trash;

  const go = (id: string) => { setHistory((h) => [...h, id]); setSel(null); };
  const crumbs: FsNode[] = [];
  for (let n = folder; n; n = fs.find((f) => f.id === n!.parentId)) crumbs.unshift(n);

  const importFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const kind = guessKind(file.name);
      let content: string | undefined;
      if (kind === "image") {
        content = await new Promise<string>((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result as string); fr.readAsDataURL(file); });
      } else if (kind === "sheet" && file.name.endsWith(".csv")) {
        const cells: Record<string, string> = {};
        (await file.text()).split(/\r?\n/).forEach((row, r) => row.split(",").forEach((v, c) => { if (v) cells[String.fromCharCode(65 + c) + (r + 1)] = v; }));
        content = JSON.stringify(cells);
      } else if (kind === "doc") {
        const t = await file.text();
        content = file.name.endsWith(".html") ? t : `<p>${t.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>`;
      } else content = await file.text();
      createFile(inTrash || cwd === ROOTS.home ? ROOTS.documents : cwd, file.name, kind, content);
    }
  };

  return (
    <div className="flex h-full flex-col text-sm">
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Back" disabled={history.length < 2} onClick={() => setHistory((h) => h.slice(0, -1))}><ArrowLeft size={16} /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Up" disabled={!folder?.parentId} onClick={() => folder?.parentId && go(folder.parentId)}><ArrowUp size={16} /></Button>
        <div className="mx-1 flex min-w-0 flex-1 items-center gap-1 truncate rounded-md border bg-background px-3 py-1.5 text-xs">
          {crumbs.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground">›</span>}
              <button className="hover:underline" onClick={() => go(c.id)}>{c.name}</button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 border-b px-2 py-1">
        {!inTrash && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="ghost"><Plus size={15} /> New</Button></DropdownMenuTrigger>
            <DropdownMenuContent className="z-[10000]">
              <DropdownMenuItem onClick={() => createFile(cwd, "New folder", "folder")}>Folder</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openFile(createFile(cwd, "New Document.docx", "doc", "<p></p>"))}>Writer document</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openFile(createFile(cwd, "New Spreadsheet.xlsx", "sheet", "{}"))}>Sheets spreadsheet</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openFile(createFile(cwd, "New Text Document.txt", "text", ""))}>Text document</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button size="sm" variant="ghost" onClick={() => fileInput.current?.click()}><Upload size={15} /> Import from this computer</Button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => { importFiles(e.target.files); e.target.value = ""; }} />
        <div className="ml-auto flex gap-1">
          {sel && !inTrash && <Button size="sm" variant="ghost" onClick={() => { trash(sel); setSel(null); }}><Trash2 size={15} /> Delete</Button>}
          {sel && inTrash && <Button size="sm" variant="ghost" onClick={() => { restore(sel); setSel(null); }}><RotateCcw size={15} /> Restore</Button>}
          {inTrash && items.length > 0 && <Button size="sm" variant="ghost" onClick={emptyTrash}>Empty Recycle Bin</Button>}
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-44 shrink-0 overflow-y-auto border-r p-2 sm:block">
          {SIDEBAR.map((s) => (
            <button key={s.id} onClick={() => go(s.id)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-hover", cwd === s.id && "bg-accent text-accent-foreground")}>
              <s.icon size={15} /> {s.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1 overflow-auto" onClick={() => setSel(null)}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); importFiles(e.dataTransfer.files); }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card text-left text-muted-foreground">
              <tr><th className="px-4 py-2 font-normal">Name</th><th className="hidden px-2 font-normal md:table-cell">Date modified</th><th className="hidden px-2 font-normal sm:table-cell">Type</th></tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} onClick={(e) => { e.stopPropagation(); setSel(f.id); }} onDoubleClick={() => (f.kind === "folder" ? go(f.id) : openFile(f))}
                  className={cn("cursor-default hover:bg-hover", sel === f.id && "bg-accent")}>
                  <td className="flex items-center gap-2 px-4 py-1.5"><FileIcon kind={f.kind} size={16} /> {f.name}</td>
                  <td className="hidden px-2 text-muted-foreground md:table-cell">{new Date(f.modified).toLocaleString()}</td>
                  <td className="hidden px-2 text-muted-foreground sm:table-cell">{kindLabel[f.kind]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && (
            <p className="p-10 text-center text-xs text-muted-foreground">
              {inTrash ? "The Recycle Bin is empty." : "This folder is empty. Drag files here or use “Import from this computer”."}
            </p>
          )}
        </div>
      </div>
      <div className="border-t px-3 py-1 text-[11px] text-muted-foreground">{items.length} items{sel ? " · 1 selected" : ""}</div>
    </div>
  );
}

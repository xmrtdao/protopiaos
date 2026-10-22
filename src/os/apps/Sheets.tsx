import { useEffect, useState } from "react";
import { Save, Download } from "lucide-react";
import { useOs } from "../store";
import { evaluate, type Cells } from "../sheet";
import { Button } from "@/components/ui/button";
import { download } from "./Writer";
import { cn } from "@/lib/utils";

const COLS = "ABCDEFGHIJ".split("");
const ROWS = 30;

export function Sheets({ winId, fileId }: { winId: string; fileId?: string | undefined }) {
  const { fs, saveFile, createFile, update } = useOs();
  const file = fs.find((f) => f.id === fileId);
  const [cells, setCells] = useState<Cells>(() => { try { return JSON.parse(file?.content || "{}"); } catch { return {}; } });
  const [sel, setSel] = useState("A1");
  const [editing, setEditing] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    update(winId, { title: `${file?.name ?? "Untitled"}${dirty ? " •" : ""} - Sheets` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.name, dirty]);

  const set = (k: string, v: string) => { setCells((c) => ({ ...c, [k]: v })); setDirty(true); };
  const save = () => {
    const data = JSON.stringify(cells);
    if (file) saveFile(file.id, { content: data });
    else update(winId, { fileId: createFile("documents", "Spreadsheet.xlsx", "sheet", data).id });
    setDirty(false);
  };
  const csv = () => {
    const rows: string[] = [];
    for (let r = 1; r <= ROWS; r++) rows.push(COLS.map((c) => evaluate(cells, c + r)).join(","));
    download((file?.name ?? "Spreadsheet").replace(/\.\w+$/, "") + ".csv", rows.join("\n").replace(/[,\n]+$/, ""), "text/csv");
  };
  const move = (dc: number, dr: number) => {
    const c = Math.min(COLS.length - 1, Math.max(0, sel.charCodeAt(0) - 65 + dc));
    const r = Math.min(ROWS, Math.max(1, +sel.slice(1) + dr));
    setSel(String.fromCharCode(65 + c) + r);
  };

  return (
    <div className="flex h-full flex-col text-xs" tabIndex={0}
      onKeyDown={(e) => {
        if (editing) return;
        if (e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); move(0, 1); }
        else if (e.key === "ArrowUp") move(0, -1);
        else if (e.key === "ArrowLeft") move(-1, 0);
        else if (e.key === "ArrowRight" || e.key === "Tab") { e.preventDefault(); move(1, 0); }
        else if (e.key === "Delete" || e.key === "Backspace") set(sel, "");
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { set(sel, e.key); setEditing(sel); }
      }}>
      <div className="flex items-center gap-1 border-b bg-card px-2 py-1">
        <Button size="sm" variant="ghost" onClick={save}><Save size={15} /> Save</Button>
        <Button size="sm" variant="ghost" onClick={csv}><Download size={15} /> Export CSV</Button>
        <span className="ml-2 hidden text-muted-foreground sm:inline">Tip: type =SUM(B2:B5) just like in Excel</span>
      </div>
      <div className="flex items-center gap-2 border-b px-2 py-1">
        <span className="w-10 rounded border bg-background px-2 py-1 text-center font-medium">{sel}</span>
        <span className="italic text-muted-foreground">fx</span>
        <input aria-label="Formula bar" value={cells[sel] ?? ""} onChange={(e) => set(sel, e.target.value)} className="flex-1 rounded border bg-background px-2 py-1 outline-none focus:border-primary" />
      </div>
      <div className="flex-1 overflow-auto bg-card">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 w-10 border border-sheet-grid bg-muted" />
              {COLS.map((c) => <th key={c} className={cn("sticky top-0 z-10 w-24 min-w-24 border border-sheet-grid bg-muted py-1 font-normal", sel[0] === c && "bg-accent text-accent-foreground")}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, i) => i + 1).map((r) => (
              <tr key={r}>
                <td className={cn("border border-sheet-grid bg-muted text-center", +sel.slice(1) === r && "bg-accent text-accent-foreground")}>{r}</td>
                {COLS.map((c) => {
                  const k = c + r;
                  const val = evaluate(cells, k);
                  const numeric = val !== "" && !isNaN(+val);
                  return (
                    <td key={k} onClick={() => setSel(k)} onDoubleClick={() => setEditing(k)}
                      className={cn("h-6 border border-sheet-grid p-0", sel === k && "outline-2 -outline-offset-1 outline-primary")}>
                      {editing === k ? (
                        <input autoFocus value={cells[k] ?? ""} onChange={(e) => set(k, e.target.value)}
                          onBlur={() => setEditing(null)}
                          onKeyDown={(e) => { if (e.key === "Enter") { setEditing(null); move(0, 1); } if (e.key === "Escape") setEditing(null); }}
                          className="h-full w-full bg-background px-1 outline-none" />
                      ) : (
                        <div className={cn("truncate px-1", numeric && "text-right")}>{val}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t bg-card px-3 py-1 text-[11px] text-muted-foreground">{dirty ? "Unsaved changes" : "All changes saved"}</div>
    </div>
  );
}

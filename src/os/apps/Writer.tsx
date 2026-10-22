import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Save, Printer, Download, Undo2, Redo2 } from "lucide-react";
import { useOs } from "../store";
import { Button } from "@/components/ui/button";

function download(name: string, data: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
}

export function Writer({ winId, fileId }: { winId: string; fileId?: string }) {
  const { fs, saveFile, createFile, update } = useOs();
  const file = fs.find((f) => f.id === fileId);
  const ref = useRef<HTMLDivElement>(null);
  const [dirty, setDirty] = useState(false);
  const [words, setWords] = useState(0);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = file?.content ?? "<p></p>";
    count();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  useEffect(() => {
    update(winId, { title: `${file?.name ?? "Untitled"}${dirty ? " •" : ""} - Writer` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.name, dirty]);

  const count = () => setWords((ref.current?.innerText.trim().match(/\S+/g) ?? []).length);
  const cmd = (c: string, v?: string) => { document.execCommand(c, false, v); ref.current?.focus(); };
  const save = () => {
    const html = ref.current?.innerHTML ?? "";
    if (file) saveFile(file.id, { content: html });
    else {
      const n = createFile("documents", "Document.docx", "doc", html);
      update(winId, { fileId: n.id });
    }
    setDirty(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && ref.current?.contains(document.activeElement)) { e.preventDefault(); save(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const T = ({ label, icon: I, onClick }: { label: string; icon: typeof Bold; onClick: () => void }) => (
    <Button size="icon" variant="ghost" className="h-8 w-8" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick}><I size={15} /></Button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-card px-2 py-1">
        <Button size="sm" variant="ghost" onClick={save}><Save size={15} /> Save</Button>
        <T label="Undo" icon={Undo2} onClick={() => cmd("undo")} />
        <T label="Redo" icon={Redo2} onClick={() => cmd("redo")} />
        <span className="mx-1 h-5 w-px bg-border" />
        <select aria-label="Style" className="h-8 rounded-md border bg-background px-2 text-xs" onChange={(e) => cmd("formatBlock", e.target.value)} defaultValue="p">
          <option value="p">Normal</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
        </select>
        <T label="Bold (Ctrl+B)" icon={Bold} onClick={() => cmd("bold")} />
        <T label="Italic (Ctrl+I)" icon={Italic} onClick={() => cmd("italic")} />
        <T label="Underline (Ctrl+U)" icon={Underline} onClick={() => cmd("underline")} />
        <span className="mx-1 h-5 w-px bg-border" />
        <T label="Bullets" icon={List} onClick={() => cmd("insertUnorderedList")} />
        <T label="Numbering" icon={ListOrdered} onClick={() => cmd("insertOrderedList")} />
        <T label="Align left" icon={AlignLeft} onClick={() => cmd("justifyLeft")} />
        <T label="Center" icon={AlignCenter} onClick={() => cmd("justifyCenter")} />
        <T label="Align right" icon={AlignRight} onClick={() => cmd("justifyRight")} />
        <span className="mx-1 h-5 w-px bg-border" />
        <T label="Print" icon={Printer} onClick={() => window.print()} />
        <T label="Download a copy" icon={Download} onClick={() => download((file?.name ?? "Document").replace(/\.\w+$/, "") + ".doc", `<html><body>${ref.current?.innerHTML}</body></html>`, "application/msword")} />
      </div>
      <div className="flex-1 overflow-auto bg-muted px-2 py-6 sm:px-8">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { setDirty(true); count(); }}
          className="mx-auto min-h-full max-w-[720px] bg-card px-8 py-10 text-[15px] leading-relaxed shadow-sm outline-none sm:px-16 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6"
        />
      </div>
      <div className="flex justify-between border-t bg-card px-3 py-1 text-[11px] text-muted-foreground">
        <span>{words} words</span><span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
      </div>
    </div>
  );
}

export { download };

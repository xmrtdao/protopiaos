import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type AppId = "explorer" | "writer" | "sheets" | "notepad" | "settings" | "welcome" | "browser" | "photos";
export type FileKind = "folder" | "doc" | "sheet" | "text" | "image";

export interface FsNode {
  id: string;
  name: string;
  parentId: string | null;
  kind: FileKind;
  content?: string | undefined;
  modified: number;
  trashedFrom?: string | undefined;
}

export interface Win {
  id: string;
  app: AppId;
  title: string;
  fileId?: string | undefined;
  folderId?: string | undefined;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  min: boolean;
  max: boolean;
}

export const ROOTS = {
  home: "home",
  desktop: "desktop",
  documents: "documents",
  pictures: "pictures",
  downloads: "downloads",
  music: "music",
  trash: "trash",
} as const;

const now = Date.now();
const seedFs: FsNode[] = [
  { id: "home", name: "This PC", parentId: null, kind: "folder", modified: now },
  { id: "desktop", name: "Desktop", parentId: "home", kind: "folder", modified: now },
  { id: "documents", name: "Documents", parentId: "home", kind: "folder", modified: now },
  { id: "pictures", name: "Pictures", parentId: "home", kind: "folder", modified: now },
  { id: "downloads", name: "Downloads", parentId: "home", kind: "folder", modified: now },
  { id: "music", name: "Music", parentId: "home", kind: "folder", modified: now },
  { id: "trash", name: "Recycle Bin", parentId: null, kind: "folder", modified: now },
  {
    id: "f-letter",
    name: "Cover Letter.docx",
    parentId: "documents",
    kind: "doc",
    modified: now,
    content:
      "<h2>Cover Letter</h2><p>Dear Hiring Manager,</p><p>I am writing to express my interest in the position. This document opens in <b>Writer</b>, which works just like the word processor you already know.</p><p>Kind regards,<br/>Alex</p>",
  },
  {
    id: "f-budget",
    name: "Household Budget.xlsx",
    parentId: "documents",
    kind: "sheet",
    modified: now,
    content: JSON.stringify({
      A1: "Item", B1: "Monthly", A2: "Rent", B2: "1200", A3: "Groceries", B3: "450",
      A4: "Utilities", B4: "180", A5: "Transport", B5: "120", A6: "Total", B6: "=SUM(B2:B5)",
    }),
  },
  { id: "f-todo", name: "Shopping list.txt", parentId: "desktop", kind: "text", modified: now, content: "Milk\nBread\nCoffee\n" },
  { id: "f-photo", name: "Wallpaper.jpg", parentId: "pictures", kind: "image", modified: now },
];

export const APPS: Record<AppId, { name: string; color: string; w: number; h: number }> = {
  explorer: { name: "File Explorer", color: "chart-4", w: 860, h: 540 },
  writer: { name: "Writer", color: "chart-1", w: 820, h: 600 },
  sheets: { name: "Sheets", color: "chart-2", w: 860, h: 560 },
  notepad: { name: "Notepad", color: "muted-foreground", w: 620, h: 460 },
  settings: { name: "Settings", color: "muted-foreground", w: 820, h: 560 },
  welcome: { name: "Welcome to Protopia", color: "chart-1", w: 760, h: 580 },
  browser: { name: "Web Browser", color: "chart-3", w: 900, h: 600 },
  photos: { name: "Photos", color: "chart-5", w: 760, h: 520 },
};

export const kindToApp: Record<Exclude<FileKind, "folder">, AppId> = {
  doc: "writer",
  sheet: "sheets",
  text: "notepad",
  image: "photos",
};

interface OsState {
  fs: FsNode[];
  windows: Win[];
  activeId: string | null;
  userName: string;
  accent: string;
  open: (app: AppId, opts?: { fileId?: string; folderId?: string }) => void;
  openFile: (node: FsNode) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  update: (id: string, patch: Partial<Win>) => void;
  toggleMin: (id: string) => void;
  createFile: (parentId: string, name: string, kind: FileKind, content?: string) => FsNode;
  saveFile: (id: string, patch: Partial<FsNode>) => void;
  trash: (id: string) => void;
  restore: (id: string) => void;
  emptyTrash: () => void;
  setUserName: (n: string) => void;
  setAccent: (a: string) => void;
}

const Ctx = createContext<OsState | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);
const STORAGE = "protopia-os-v1";

export function OsProvider({ children }: { children: ReactNode }) {
  const [fs, setFs] = useState<FsNode[]>(seedFs);
  const [windows, setWindows] = useState<Win[]>([]);
  const [activeId, setActive] = useState<string | null>(null);
  const [userName, setUserName] = useState("Alex");
  const [accent, setAccent] = useState("oklch(0.55 0.15 245)");
  const zRef = useRef(10);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE) || "null");
      if (s) {
        if (s.fs) setFs(s.fs);
        if (s.userName) setUserName(s.userName);
        if (s.accent) setAccent(s.accent);
      }
      if (!s?.welcomed) setTimeout(() => open("welcome"), 300);
    } catch {
      /* ignore */
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(STORAGE, JSON.stringify({ fs, userName, accent, welcomed: true }));
  }, [fs, userName, accent]);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", accent);
    document.documentElement.style.setProperty("--ring", accent);
  }, [accent]);

  const open = useCallback((app: AppId, opts?: { fileId?: string; folderId?: string }) => {
    setWindows((ws) => {
      const existing = ws.find(
        (w) => w.app === app && (opts?.fileId ? w.fileId === opts.fileId : app === "settings" || app === "welcome"),
      );
      const z = ++zRef.current;
      if (existing) {
        setActive(existing.id);
        return ws.map((w) => (w.id === existing.id ? { ...w, z, min: false } : w));
      }
      const meta = APPS[app];
      const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
      const vh = typeof window !== "undefined" ? window.innerHeight - 48 : 800;
      const mobile = vw < 768;
      const w = Math.min(meta.w, vw - 40);
      const h = Math.min(meta.h, vh - 40);
      const off = (ws.length % 6) * 28;
      const id = uid();
      setActive(id);
      return [
        ...ws,
        {
          id,
          app,
          title: meta.name,
          ...opts,
          x: Math.max(10, (vw - w) / 2 - 80 + off),
          y: Math.max(10, (vh - h) / 2 - 30 + off),
          w,
          h,
          z,
          min: false,
          max: mobile,
        },
      ];
    });
  }, []);

  const openFile = useCallback(
    (n: FsNode) => {
      if (n.kind === "folder") open("explorer", { folderId: n.id });
      else open(kindToApp[n.kind], { fileId: n.id });
    },
    [open],
  );

  const focus = (id: string) => {
    const z = ++zRef.current;
    setActive(id);
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, z, min: false } : w)));
  };

  const value: OsState = {
    fs,
    windows,
    activeId,
    userName,
    accent,
    open,
    openFile,
    focus,
    close: (id) => setWindows((ws) => ws.filter((w) => w.id !== id)),
    update: (id, patch) => setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w))),
    toggleMin: (id) => {
      const w = windows.find((x) => x.id === id);
      if (!w) return;
      if (w.min || activeId !== id) focus(id);
      else {
        setWindows((ws) => ws.map((x) => (x.id === id ? { ...x, min: true } : x)));
        setActive(null);
      }
    },
    createFile: (parentId, name, kind, content) => {
      let finalName = name;
      let i = 2;
      while (fs.some((f) => f.parentId === parentId && f.name === finalName)) {
        finalName = name.replace(/(\.[^.]+)?$/, ` (${i++})$1`);
      }
      const node: FsNode = { id: uid(), name: finalName, parentId, kind, content, modified: Date.now() };
      setFs((f) => [...f, node]);
      return node;
    },
    saveFile: (id, patch) =>
      setFs((f) => f.map((n) => (n.id === id ? { ...n, ...patch, modified: Date.now() } : n))),
    trash: (id) =>
      setFs((f) => f.map((n) => (n.id === id ? { ...n, trashedFrom: n.parentId ?? undefined, parentId: "trash" } : n))),
    restore: (id) =>
      setFs((f) =>
        f.map((n) => (n.id === id ? { ...n, parentId: n.trashedFrom ?? "documents", trashedFrom: undefined } : n)),
      ),
    emptyTrash: () => setFs((f) => f.filter((n) => n.parentId !== "trash")),
    setUserName,
    setAccent,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOs() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOs outside OsProvider");
  return c;
}

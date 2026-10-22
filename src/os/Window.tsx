import { Minus, Square, Copy, X } from "lucide-react";
import type { ReactNode } from "react";
import { useOs, type Win } from "./store";
import { AppIcon } from "./icons";
import { cn } from "@/lib/utils";

export function Window({ win, children }: { win: Win; children: ReactNode }) {
  const { focus, close, update, activeId } = useOs();
  const active = activeId === win.id;

  const startDrag = (e: React.PointerEvent) => {
    if (win.max || (e.target as HTMLElement).closest("button")) return;
    focus(win.id);
    const sx = e.clientX - win.x;
    const sy = e.clientY - win.y;
    const move = (ev: PointerEvent) =>
      update(win.id, { x: ev.clientX - sx, y: Math.max(0, ev.clientY - sy) });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, w0 = win.w, h0 = win.h;
    const move = (ev: PointerEvent) =>
      update(win.id, { w: Math.max(360, w0 + ev.clientX - sx), h: Math.max(260, h0 + ev.clientY - sy) });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      role="dialog"
      aria-label={win.title}
      onPointerDown={() => !active && focus(win.id)}
      className={cn(
        "absolute flex flex-col overflow-hidden border bg-card shadow-window animate-pop",
        win.max ? "rounded-none" : "rounded-lg",
        win.min && "hidden",
      )}
      style={
        win.max
          ? { left: 0, top: 0, width: "100%", height: "calc(100% - 48px)", zIndex: win.z }
          : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }
      }
    >
      <div
        onPointerDown={startDrag}
        onDoubleClick={() => update(win.id, { max: !win.max })}
        className={cn("flex h-9 shrink-0 select-none items-center pl-3", active ? "bg-secondary" : "bg-muted text-muted-foreground")}
      >
        <AppIcon app={win.app} size={15} />
        <span className="ml-2 truncate text-xs">{win.title}</span>
        <div className="ml-auto flex h-full">
          <button aria-label="Minimize" onClick={() => update(win.id, { min: true })} className="flex w-11 items-center justify-center hover:bg-hover">
            <Minus size={14} />
          </button>
          <button aria-label={win.max ? "Restore" : "Maximize"} onClick={() => update(win.id, { max: !win.max })} className="flex w-11 items-center justify-center hover:bg-hover">
            {win.max ? <Copy size={12} /> : <Square size={11} />}
          </button>
          <button aria-label="Close" onClick={() => close(win.id)} className="flex w-11 items-center justify-center hover:bg-destructive hover:text-destructive-foreground">
            <X size={15} />
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
      {!win.max && <div onPointerDown={startResize} className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize" />}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTerminalConfig } from "./config-store";

const MIN = 15;
const MAX = 70;

export function ResizableColumns({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  const [cfg, update] = useTerminalConfig();
  const [l, c, r] = cfg.cols;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<null | "lc" | "cr">(null);

  const onDown = (which: "lc" | "cr") => (e: React.PointerEvent) => {
    if (window.innerWidth < 1024) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = which;
  };

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      if (dragging.current === "lc") {
        const newL = Math.min(MAX, Math.max(MIN, pct));
        const remaining = 100 - newL;
        // keep right/center proportional
        const oldSum = c + r || 1;
        const newC = Math.max(MIN, (c / oldSum) * remaining);
        const newR = Math.max(MIN, remaining - newC);
        update({ cols: [newL, newC, newR] });
      } else {
        const newRstart = pct;
        const newR = Math.min(MAX, Math.max(MIN, 100 - newRstart));
        const newC = Math.max(MIN, 100 - l - newR);
        update({ cols: [l, newC, newR] });
      }
    },
    [c, r, l, update],
  );

  const onUp = useCallback(() => {
    dragging.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onMove, onUp]);

  // Reset helper — double-click any handle
  const reset = () => update({ cols: [25, 50, 25] });

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const upd = () => setIsDesktop(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  return (
    <div
      ref={containerRef}
      className="grid gap-4 lg:gap-0"
      style={{
        gridTemplateColumns: isDesktop ? `${l}% 8px ${c}% 8px ${r}%` : "1fr",
      }}
    >
      {/* On mobile these all stack; on lg we use the grid template above */}
      <div className="lg:pr-3 min-w-0">{left}</div>
      <div
        onPointerDown={onDown("lc")}
        onDoubleClick={reset}
        className="hidden lg:flex items-center justify-center cursor-col-resize group"
        title="Drag to resize · double-click to reset"
      >
        <div className="h-16 w-[3px] rounded-full bg-glass-border group-hover:bg-teal/60 transition-colors" />
      </div>
      <div className="lg:px-3 min-w-0">{center}</div>
      <div
        onPointerDown={onDown("cr")}
        onDoubleClick={reset}
        className="hidden lg:flex items-center justify-center cursor-col-resize group"
        title="Drag to resize · double-click to reset"
      >
        <div className="h-16 w-[3px] rounded-full bg-glass-border group-hover:bg-teal/60 transition-colors" />
      </div>
      <div className="lg:pl-3 min-w-0">{right}</div>
    </div>
  );
}

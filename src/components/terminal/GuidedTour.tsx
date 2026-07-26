import { useEffect, useLayoutEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";

type Step = {
  target: string; // data-tour attribute value
  title: string;
  body: string;
};

const steps: Step[] = [
  {
    target: "commandbar",
    title: "Command bar & palette",
    body:
      "Press ⌘K anywhere to jump to a market, focus a panel, switch themes or start this tour again. Everything the terminal does is one search away.",
  },
  {
    target: "theme",
    title: "Themes & contrast",
    body:
      "Switch the Puls accent (navy / teal / pink) and comfort vs high contrast without reloading. Your choice persists across sessions.",
  },
  {
    target: "notifications",
    title: "Notifications & triggers",
    body:
      "Alerts fire automatically on sharp price moves in the Live Tape and on arbitrage edges in the Order Book. Click the bell to review or mute.",
  },
  {
    target: "markets",
    title: "Markets column",
    body:
      "Live prediction markets, sorted by activity. Click any card — or use ⌘K — to load it into the Arena. Drag the divider to the right to widen this column.",
  },
  {
    target: "arena",
    title: "Arena — the selected market",
    body:
      "YES/NO pricing, consensus, price history and quick actions for the currently focused market. Show market for a deeper drill-down.",
  },
  {
    target: "orderbook",
    title: "Order Book",
    body:
      "Depth ladder for the current market. Sudden imbalances trigger toast alerts on the right side of your screen.",
  },
  {
    target: "swarm",
    title: "Swarm & Decision Stream",
    body:
      "See how the agent swarm is voting in real time. Nodes closer to the center are more confident; the log below shows their live actions.",
  },
  {
    target: "roster",
    title: "Agent Roster",
    body:
      "Track individual agents — weekly PnL, win-rate and latest thought. Drag the vertical dividers between columns to resize the whole layout.",
  },
];

function findEl(target: string) {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
}

export function GuidedTour({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const step = steps[i];
    const measure = () => {
      const el = findEl(step.target);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        // scrollIntoView is smooth; grab rect after a beat
        requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
      } else {
        setRect(null);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, i]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  if (!open) return null;

  const step = steps[i];
  const total = steps.length;

  const next = () => (i < total - 1 ? setI(i + 1) : onClose());
  const prev = () => setI(Math.max(0, i - 1));

  // Compute tooltip position — prefer below, fall back above
  const pad = 12;
  const tooltipW = 340;
  const tooltipH = 190;
  let top = 80;
  let left = window.innerWidth / 2 - tooltipW / 2;
  if (rect) {
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow > tooltipH + pad + 20) {
      top = rect.bottom + pad;
    } else {
      top = Math.max(pad, rect.top - tooltipH - pad);
    }
    left = Math.min(
      Math.max(pad, rect.left + rect.width / 2 - tooltipW / 2),
      window.innerWidth - tooltipW - pad,
    );
  }

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none">
      {/* Dimmed backdrop with cut-out via 4 rectangles */}
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose}>
        {rect ? (
          <>
            <div
              className="absolute bg-navy/80 backdrop-blur-[2px]"
              style={{ left: 0, top: 0, right: 0, height: rect.top - 6 }}
            />
            <div
              className="absolute bg-navy/80 backdrop-blur-[2px]"
              style={{
                left: 0,
                top: rect.top - 6,
                width: rect.left - 6,
                height: rect.height + 12,
              }}
            />
            <div
              className="absolute bg-navy/80 backdrop-blur-[2px]"
              style={{
                left: rect.right + 6,
                top: rect.top - 6,
                right: 0,
                height: rect.height + 12,
              }}
            />
            <div
              className="absolute bg-navy/80 backdrop-blur-[2px]"
              style={{
                left: 0,
                top: rect.bottom + 6,
                right: 0,
                bottom: 0,
              }}
            />
            {/* Highlight ring */}
            <div
              className="absolute rounded-xl ring-2 ring-teal shadow-[0_0_40px_rgba(45,212,191,0.45)] pointer-events-none"
              style={{
                left: rect.left - 6,
                top: rect.top - 6,
                width: rect.width + 12,
                height: rect.height + 12,
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-navy/70 backdrop-blur-[2px]" />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto rounded-xl border border-teal/30 bg-navy/95 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-4"
        style={{ top, left, width: tooltipW }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-teal">
            Tour · {i + 1} / {total}
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white"
            aria-label="Close tour"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">{step.body}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, k) => (
              <span
                key={k}
                className={
                  "h-1 rounded-full transition-all " +
                  (k === i ? "w-6 bg-teal" : "w-1.5 bg-white/15")
                }
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={prev}
              disabled={i === 0}
              className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 px-3 py-1 rounded bg-teal text-navy font-bold text-[10px] uppercase tracking-widest hover:bg-teal/90"
            >
              {i === total - 1 ? "Done" : "Next"}
              {i < total - 1 && <ArrowRight className="size-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

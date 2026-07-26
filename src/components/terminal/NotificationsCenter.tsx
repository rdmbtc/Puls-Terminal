import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Trash2, Waves, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useTerminalConfig } from "./config-store";
import { markets } from "./mock-data";

export type Alert = {
  id: string;
  kind: "move" | "arb" | "depth";
  title: string;
  detail: string;
  ts: number;
  tone: "teal" | "pink" | "amber";
};

const seedAlerts: Alert[] = [
  {
    id: "seed-1",
    kind: "arb",
    title: "Arb edge · BTC-100K",
    detail: "Puls 0.670 → Polymarket 0.688 · +2.1% edge",
    ts: Date.now() - 1000 * 60 * 2,
    tone: "teal",
  },
  {
    id: "seed-2",
    kind: "move",
    title: "Sharp move · FED-CUT.JUL",
    detail: "YES jumped +6.8% in 5m — swarm consensus 0.74",
    ts: Date.now() - 1000 * 60 * 6,
    tone: "pink",
  },
  {
    id: "seed-3",
    kind: "depth",
    title: "Depth imbalance · SOL-300",
    detail: "Bid wall 4.7k vs ask 1.6k · likely bounce",
    tone: "amber",
    ts: Date.now() - 1000 * 60 * 12,
  },
];

const templates = [
  (): Alert => {
    const m = markets[Math.floor(Math.random() * markets.length)];
    const move = (Math.random() * 6 + 2).toFixed(1);
    const up = Math.random() > 0.4;
    return {
      id: crypto.randomUUID(),
      kind: "move",
      tone: up ? "teal" : "pink",
      title: `Sharp move · ${m.ticker}`,
      detail: `${up ? "+" : "−"}${move}% in 3m · vol +${(Math.random() * 40 + 10).toFixed(0)}%`,
      ts: Date.now(),
    };
  },
  (): Alert => {
    const m = markets[Math.floor(Math.random() * markets.length)];
    const edge = (Math.random() * 2 + 0.6).toFixed(1);
    return {
      id: crypto.randomUUID(),
      kind: "arb",
      tone: "teal",
      title: `Arb edge · ${m.ticker}`,
      detail: `Puls ↔ Kalshi spread · +${edge}% edge`,
      ts: Date.now(),
    };
  },
  (): Alert => {
    const m = markets[Math.floor(Math.random() * markets.length)];
    return {
      id: crypto.randomUUID(),
      kind: "depth",
      tone: "amber",
      title: `Depth imbalance · ${m.ticker}`,
      detail: `Bid/ask skew · ${(Math.random() * 3 + 1.5).toFixed(1)}× on bid`,
      ts: Date.now(),
    };
  },
];

function toneClass(tone: Alert["tone"]) {
  return tone === "teal"
    ? "text-teal border-teal/30 bg-teal/5"
    : tone === "pink"
      ? "text-pink border-pink/30 bg-pink/5"
      : "text-amber-400 border-amber-500/30 bg-amber-500/5";
}

function iconFor(kind: Alert["kind"]) {
  return kind === "arb" ? Zap : kind === "depth" ? Waves : TrendingUp;
}

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export function useNotifications() {
  const [cfg] = useTerminalConfig();
  const [alerts, setAlerts] = useState<Alert[]>(seedAlerts);
  const [unseen, setUnseen] = useState(0);
  const [open, setOpen] = useState(false);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  // Auto-generate alerts on an interval simulating live tape / order book triggers
  useEffect(() => {
    const iv = setInterval(
      () => {
        const alert = templates[Math.floor(Math.random() * templates.length)]();
        setAlerts((prev) => [alert, ...prev].slice(0, 40));
        setUnseen((u) => u + 1);
        if (!cfgRef.current.alertsMuted) {
          const Icon = iconFor(alert.kind);
          toast(alert.title, {
            description: alert.detail,
            icon: <Icon className="size-4" />,
            className:
              alert.tone === "pink"
                ? "!border-pink/40"
                : alert.tone === "amber"
                  ? "!border-amber-500/40"
                  : "!border-teal/40",
          });
        }
      },
      8000 + Math.random() * 6000,
    );
    return () => clearInterval(iv);
  }, []);

  const clear = () => {
    setAlerts([]);
    setUnseen(0);
  };
  const openPanel = () => {
    setOpen(true);
    setUnseen(0);
  };

  return { alerts, unseen, open, setOpen: openPanel, close: () => setOpen(false), clear };
}

export function NotificationsBell({
  unseen,
  onOpen,
}: {
  unseen: number;
  onOpen: () => void;
}) {
  const [cfg, update] = useTerminalConfig();
  return (
    <div
      data-tour="notifications"
      className="flex items-center gap-1 px-1 py-0.5 rounded-md border border-glass-border bg-white/5 backdrop-blur-md"
    >
      <button
        onClick={onOpen}
        title="Notifications"
        className="relative p-1 rounded hover:bg-white/5 text-slate-300"
      >
        <Bell className="size-3.5" />
        {unseen > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-3.5 h-3.5 px-1 rounded-full bg-pink text-[9px] font-mono font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(236,72,153,0.6)]">
            {unseen > 9 ? "9+" : unseen}
          </span>
        )}
      </button>
      <button
        onClick={() => update({ alertsMuted: !cfg.alertsMuted })}
        title={cfg.alertsMuted ? "Unmute alerts" : "Mute alerts"}
        className={
          "p-1 rounded hover:bg-white/5 " +
          (cfg.alertsMuted ? "text-slate-500" : "text-teal")
        }
      >
        {cfg.alertsMuted ? <BellOff className="size-3.5" /> : <span className="block size-1.5 rounded-full bg-teal animate-pulse" />}
      </button>
    </div>
  );
}

export function NotificationsPanel({
  open,
  onClose,
  alerts,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  alerts: Alert[];
  onClear: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]" />
      <div
        className="absolute right-4 top-16 w-[360px] max-h-[70vh] flex flex-col rounded-xl border border-glass-border bg-navy/95 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <Bell className="size-3.5 text-teal" />
            <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
              Alerts
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              {alerts.length}
            </span>
          </div>
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-pink"
          >
            <Trash2 className="size-3" />
            Clear
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-glass-border">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-[11px] font-mono text-slate-500 uppercase tracking-widest">
              No alerts yet
            </div>
          ) : (
            alerts.map((a) => {
              const Icon = iconFor(a.kind);
              return (
                <div key={a.id} className="p-3 flex gap-3 hover:bg-white/[0.02]">
                  <div
                    className={
                      "size-7 shrink-0 grid place-items-center rounded-md border " +
                      toneClass(a.tone)
                    }
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-white font-medium truncate">
                        {a.title}
                      </p>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0">
                        {timeAgo(a.ts)}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-snug mt-0.5">
                      {a.detail}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

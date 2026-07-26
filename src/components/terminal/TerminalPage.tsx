import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Bot,
  Command,
  Cpu,
  Radio,
  Search,
  Shield,
  Signal,
  Sparkle,
  Swords,
  Terminal as TerminalIcon,
  Timer,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import { useTerminalConfig, type PulsTheme } from "./config-store";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { CommandPalette, type PaletteAction } from "./CommandPalette";
import { GuidedTour } from "./GuidedTour";
import {
  NotificationsBell,
  NotificationsPanel,
  useNotifications,
} from "./NotificationsCenter";
import { ResizableColumns } from "./ResizableColumns";
import {
  emojiFor,
  fmtNum,
  fmtUsd,
  relTime,
  shortAddr,
  useBonds,
  useDuels,
  useFeed,
  useHealth,
  useMarkets,
  usePnl,
  useRoster,
  useStats,
  useX402,
  type FeedEvent,
  type NormalizedMarket,
} from "./api";

const tabs = ["Overview", "Live", "Analytics", "Markets", "Agents"] as const;
const themeOrder: PulsTheme[] = ["navy", "teal", "pink"];

/* ============================ Feed tone mapping ============================ */

function feedTone(action?: string): {
  label: string;
  className: string;
  dot: string;
} {
  const a = (action || "").toLowerCase();
  if (a.includes("stream"))
    return { label: "x402", className: "text-[color:var(--color-purple)] border-[color:var(--color-purple)]/30 bg-[color:var(--color-purple)]/10", dot: "bg-[color:var(--color-purple)]" };
  if (a.includes("skip"))
    return { label: "SKIP", className: "text-slate-400 border-slate-600/40 bg-slate-500/5", dot: "bg-slate-500" };
  if (a.includes("bond"))
    return { label: "BOND", className: "text-[color:var(--color-warn)] border-[color:var(--color-warn)]/30 bg-[color:var(--color-warn)]/10", dot: "bg-[color:var(--color-warn)]" };
  if (a.includes("slash"))
    return { label: "SLASH", className: "text-[color:var(--color-bad)] border-[color:var(--color-bad)]/30 bg-[color:var(--color-bad)]/10", dot: "bg-[color:var(--color-bad)]" };
  if (a.includes("signal"))
    return { label: "SIGNAL", className: "text-pink border-pink/30 bg-pink/10", dot: "bg-pink" };
  if (a.includes("duel"))
    return { label: "DUEL", className: "text-teal border-teal/30 bg-teal/10", dot: "bg-teal" };
  if (a.includes("create"))
    return { label: "CREATE", className: "text-pink border-pink/30 bg-pink/10", dot: "bg-pink" };
  return { label: "TRADE", className: "text-teal border-teal/30 bg-teal/10", dot: "bg-teal" };
}

/* ============================ Page ============================ */

export function TerminalPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [marketPage, setMarketPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const notifications = useNotifications();
  const [cfg, update] = useTerminalConfig();

  const marketsQ = useMarkets(30);
  const markets = marketsQ.data ?? [];
  const selected =
    markets.find((m) => m.slug === selectedSlug) ?? markets[0] ?? null;

  const arenaRef = useRef<HTMLDivElement>(null);
  const orderBookRef = useRef<HTMLDivElement>(null);
  const swarmRef = useRef<HTMLDivElement>(null);
  const rosterRef = useRef<HTMLDivElement>(null);
  const arbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cfg.tourSeen) {
      const t = setTimeout(() => setTourOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, [cfg.tourSeen]);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    if (!cfg.tourSeen) update({ tourSeen: true });
  }, [cfg.tourSeen, update]);

  const runAction = useCallback(
    (a: PaletteAction) => {
      switch (a.kind) {
        case "select-market": {
          setSelectedSlug(a.slug);
          arenaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        case "focus": {
          const map = {
            arena: arenaRef,
            orderbook: orderBookRef,
            swarm: swarmRef,
            roster: rosterRef,
            arb: arbRef,
          } as const;
          map[a.target].current?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        case "cycle-theme": {
          const i = themeOrder.indexOf(cfg.theme);
          update({ theme: themeOrder[(i + 1) % themeOrder.length] });
          return;
        }
        case "toggle-contrast":
          update({ contrast: cfg.contrast === "high" ? "comfort" : "high" });
          return;
        case "toggle-alerts":
          update({ alertsMuted: !cfg.alertsMuted });
          return;
        case "start-tour":
          setTourOpen(true);
          return;
      }
    },
    [cfg, update],
  );

  return (
    <div className="min-h-screen bg-navy text-slate-200 font-sans selection:bg-teal/30 cyber-grid relative overflow-x-hidden">
      <div className="absolute -top-40 -left-40 size-[520px] bg-teal/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] -right-40 size-[520px] bg-pink/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 size-[420px] bg-teal/5 blur-[120px] rounded-full pointer-events-none" />

      <CommandBar
        onOpenPalette={() => setPaletteOpen(true)}
        unseenAlerts={notifications.unseen}
        onOpenAlerts={notifications.setOpen}
        onStartTour={() => setTourOpen(true)}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-6 pb-24">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <a href="https://pulsmarket.tech" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-glass-border bg-white/5 hover:bg-white/10 text-slate-400 hover:text-teal transition-all text-[10px] font-mono uppercase tracking-wider" title="Back to Puls">
                <ArrowUpRight className="size-3 rotate-[225deg]" />
                <span className="hidden sm:inline">Puls</span>
              </a>
              <BrandMark />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white uppercase leading-none">
                  Puls <span className="text-teal">Terminal</span>
                </h1>
                <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
                  v4.0.2 · Arena Layer · Arc testnet
                </p>
              </div>
            </div>

            <nav className="flex bg-white/5 border border-glass-border p-1 rounded-xl backdrop-blur-md">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all " +
                    (tab === t
                      ? "bg-teal/10 text-teal shadow-[0_0_20px_rgba(45,212,191,0.15)]"
                      : "text-slate-400 hover:text-white")
                  }
                >
                  {t}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <HealthPill />
              <ThemeSwitcher />
              <NotificationsBell
                unseen={notifications.unseen}
                onOpen={notifications.setOpen}
              />
              <button
                onClick={() => setTourOpen(true)}
                title="Guided tour (?)"
                className="flex items-center gap-1 px-2 py-1 rounded-md border border-glass-border bg-white/5 hover:bg-white/10 text-slate-300 backdrop-blur-md"
              >
                <BookOpen className="size-3 text-teal" />
                <span className="text-[9px] font-mono uppercase tracking-wider">Tour</span>
              </button>
            </div>
          </div>

          <TopStats />
        </header>

        {/* ===== TAB CONTENT ===== */}
        <div key={tab} className="animate-[fade-in-up_0.2s_ease-out]">
        {(tab === "Overview" || tab === "Markets") && (
        <ResizableColumns
          left={
            <section data-tour="markets" className="space-y-3">
              <SectionHeader
                icon={<Waves className="size-3.5" />}
                title="Markets"
                hint={
                  marketsQ.isLoading
                    ? "syncing…"
                    : `${markets.length} live`
                }
              />
              {/* Search */}
              <input
                type="text"
                placeholder="Search markets…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setMarketPage(0); }}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-teal/30 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal/50 focus:border-teal/50 font-mono"
              />
              <div className="space-y-2">
                {marketsQ.isLoading && <SkeletonRows n={5} />}
                {!marketsQ.isLoading && markets.length === 0 && (
                  <EmptyBlock>No markets returned by API.</EmptyBlock>
                )}
                {(() => {
                  const filtered = searchQuery
                    ? markets.filter((m) =>
                        m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.ticker.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    : markets;
                  const perPage = 7;
                  const totalPages = Math.ceil(filtered.length / perPage);
                  const paged = filtered.slice(marketPage * perPage, (marketPage + 1) * perPage);
                  return (
                    <>
                      {paged.map((m) => (
                        <MarketRow
                          key={m.slug}
                          market={m}
                          active={selected?.slug === m.slug}
                          onClick={() => setSelectedSlug(m.slug)}
                        />
                      ))}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 pt-2">
                          {Array.from({ length: totalPages }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => setMarketPage(i)}
                              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                                marketPage === i
                                  ? "bg-teal/20 text-teal border border-teal/40"
                                  : "bg-white/5 text-slate-400 border border-glass-border hover:text-white hover:bg-white/10"
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </section>
          }
          center={
            <section className="space-y-4">
              <div ref={arenaRef} data-tour="arena">
                {selected ? <Arena market={selected} /> : <ArenaSkeleton />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selected && <PnLPanel market={selected} />}
                <div ref={orderBookRef} data-tour="orderbook">
                  <OrderBookComingSoon />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <X402Panel />
                {selected && <ResolutionTimeline market={selected} />}
              </div>
            </section>
          }
          right={
            <aside className="space-y-4">
              <div ref={swarmRef} data-tour="swarm">
                <SwarmVisualizer />
              </div>
              <DecisionLog />
            </aside>
          }
        />
        )}

        {/* LIVE TAB */}
        {tab === "Live" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <DecisionLog />
            </div>
            <div className="space-y-4">
              <X402Panel />
              <SwarmVisualizer />
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === "Analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <AgentRoster />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <BondSlashPanel />
              {selected && <PnLPanel market={selected} />}
            </div>
          </div>
        )}

        {/* AGENTS TAB */}
        {tab === "Agents" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div ref={rosterRef} data-tour="roster" className="lg:col-span-6">
              <AgentRoster />
            </div>
            <div className="lg:col-span-3">
              <BondSlashPanel />
            </div>
            <div ref={arbRef} className="lg:col-span-3">
              <DuelsPanel />
            </div>
          </div>
        )}

        {/* OVERVIEW BOTTOM (only on Overview tab) */}
        {tab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          <div ref={rosterRef} data-tour="roster" className="lg:col-span-6">
            <AgentRoster />
          </div>
          <div className="lg:col-span-3">
            <BondSlashPanel />
          </div>
          <div ref={arbRef} className="lg:col-span-3">
            <DuelsPanel />
          </div>
        </div>
        )}
        </div>{/* end tab content animated wrapper */}

        {/* Footer */}
        <footer className="mt-12 mb-16 border-t border-glass-border pt-6">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Puls" className="size-5 rounded" />
              <span className="text-slate-400">Puls Terminal</span>
              <span>·</span>
              <span>Prediction markets on Arc, traded by AI</span>
            </div>
            <nav className="flex items-center gap-4">
              <a href="https://pulsmarket.tech" className="hover:text-teal transition-colors">Home</a>
              <a href="https://app.pulsmarket.tech" className="hover:text-teal transition-colors">App</a>
              <a href="https://pulsmarket.tech/pulse" className="hover:text-teal transition-colors">Agent Feed</a>
              <a href="https://pulsmarket.tech/versus" className="hover:text-teal transition-colors">Versus</a>
              <a href="https://pulsmarket.tech/stats" className="hover:text-teal transition-colors">Stats</a>
              <a href="https://pulsmarket.tech/explorer" className="hover:text-teal transition-colors">Explorer</a>
              <a href="https://github.com/rdmbtc/Puls" target="_blank" rel="noopener" className="hover:text-teal transition-colors">GitHub</a>
              <a href="https://x.com/pulsmarket" target="_blank" rel="noopener" className="hover:text-pink transition-colors">𝕏 @pulsmarket</a>
            </nav>
          </div>
        </footer>
      </div>

      <LiveTicker />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onAction={runAction}
        markets={markets.map((m) => ({
          slug: m.slug,
          ticker: m.ticker,
          question: m.question,
        }))}
      />
      <NotificationsPanel
        open={notifications.open}
        onClose={notifications.close}
        alerts={notifications.alerts}
        onClear={notifications.clear}
      />
      <GuidedTour open={tourOpen} onClose={closeTour} />
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

/* ============================ ATOMS ============================ */

function BrandMark() {
  return (
    <div className="relative">
      <div className="size-11 rounded-xl flex items-center justify-center border border-teal/30 shadow-[0_0_28px_rgba(45,212,191,0.35)] overflow-hidden">
        <img src="/logo.png" alt="Puls" className="size-11 object-cover" />
      </div>
      <div className="absolute -inset-1 rounded-xl bg-teal/20 blur-lg -z-10" />
    </div>
  );
}

function PillStat({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "teal" | "pink" | "slate" | "warn" | "bad";
}) {
  const map: Record<string, string> = {
    teal: "text-teal border-teal/30 bg-teal/5",
    pink: "text-pink border-pink/30 bg-pink/5",
    slate: "text-slate-400 border-glass-border bg-white/5",
    warn: "text-[color:var(--color-warn)] border-[color:var(--color-warn)]/30 bg-[color:var(--color-warn)]/5",
    bad: "text-[color:var(--color-bad)] border-[color:var(--color-bad)]/30 bg-[color:var(--color-bad)]/5",
  };
  return (
    <div
      className={
        "flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] uppercase tracking-wider backdrop-blur-md " +
        map[tone]
      }
    >
      {icon}
      {label}
    </div>
  );
}

function HealthPill() {
  const { data } = useHealth();
  if (!data) return <PillStat icon={<Signal className="size-3" />} label="…" tone="slate" />;
  const cbOpen = Object.values(data.circuitBreakers ?? {}).some((c) => c.isOpen);
  const lag = data.eventLoopLagMs;
  return (
    <>
      <PillStat
        icon={<Signal className="size-3" />}
        label={`${lag}ms`}
        tone={lag < 30 ? "teal" : lag < 100 ? "warn" : "bad"}
      />
      <PillStat
        icon={<Cpu className="size-3" />}
        label={`${data.memory.heapUsedMb}MB heap`}
        tone={cbOpen ? "bad" : "slate"}
      />
    </>
  );
}

function BigStat({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta?: string;
  tone: "teal" | "pink" | "purple";
}) {
  const toneCls =
    tone === "teal"
      ? "text-teal"
      : tone === "pink"
        ? "text-pink"
        : "text-[color:var(--color-purple)]";
  return (
    <div className="bg-glass border border-glass-border p-4 rounded-xl backdrop-blur-md relative overflow-hidden group hover:border-teal/20 transition-colors">
      <div className="absolute -top-8 -right-8 size-24 bg-teal/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-mono text-white font-medium leading-tight animate-[count-fade_0.8s_ease-out]">{value}</p>
      {delta && (
        <div className={"flex items-center gap-1 mt-1 text-[10px] font-mono " + toneCls}>
          <TrendingUp className="size-3" />
          {delta}
        </div>
      )}
    </div>
  );
}

function TopStats() {
  const { data: s, isLoading } = useStats();
  const { data: h } = useHealth();
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <BigStat
        label="Total Volume"
        value={isLoading ? "…" : fmtUsd(s?.totalVolumeUsdc ?? 0)}
        delta="testnet"
        tone="teal"
      />
      <BigStat
        label="Active Agents"
        value={isLoading ? "…" : String(s?.agents ?? 0)}
        delta={s ? `${fmtNum(s.agentTrades)} trades` : undefined}
        tone="teal"
      />
      <BigStat
        label="Trades Settled"
        value={isLoading ? "…" : fmtNum(s?.trades ?? 0)}
        delta={s ? `${fmtNum(s.humanTrades)} human` : undefined}
        tone="pink"
      />
      <BigStat
        label="Nanopayments"
        value={isLoading ? "…" : fmtNum(s?.nanopayments.count ?? 0)}
        delta={s ? fmtUsd(s.nanopayments.volumeUsdc) + " x402" : undefined}
        tone="purple"
      />
      <div className="bg-glass border border-glass-border p-4 rounded-xl backdrop-blur-md flex flex-col justify-between">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
          System Health
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="size-2 bg-teal rounded-full animate-pulse" />
            <div className="absolute inset-0 size-2 bg-teal rounded-full blur-[6px]" />
          </div>
          <p className="text-sm text-teal font-medium">
            {h ? `Up ${Math.floor(h.uptimeSec / 60)}m · load ${h.load1.toFixed(2)}` : "Checking…"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-teal">{icon}</span>
        <h2 className="text-[11px] font-semibold text-white uppercase tracking-widest">
          {title}
        </h2>
      </div>
      {hint && (
        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-teal animate-pulse" />
          {hint}
        </span>
      )}
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "bg-glass border border-glass-border rounded-xl backdrop-blur-md " + className
      }
    >
      {children}
    </div>
  );
}

function EmptyBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 text-center text-[11px] font-mono text-slate-500 border border-dashed border-glass-border rounded-xl">
      {children}
    </div>
  );
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-xl border border-glass-border bg-white/[0.02] animate-pulse"
        >
          <div className="h-3 w-16 bg-white/10 rounded mb-2" />
          <div className="h-3 w-full bg-white/5 rounded mb-2" />
          <div className="h-2 w-1/2 bg-white/5 rounded" />
        </div>
      ))}
    </>
  );
}

/* ============================ COMMAND BAR ============================ */

function CommandBar({
  onOpenPalette,
  unseenAlerts,
  onOpenAlerts,
  onStartTour,
}: {
  onOpenPalette: () => void;
  unseenAlerts: number;
  onOpenAlerts: () => void;
  onStartTour: () => void;
}) {
  return (
    <div
      data-tour="commandbar"
      className="sticky top-0 z-40 backdrop-blur-xl bg-navy/70 border-b border-glass-border"
    >
      <div className="max-w-[1400px] mx-auto px-6 h-11 flex items-center gap-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-500 shrink-0">
          <TerminalIcon className="size-3.5 text-teal" />
          <span className="text-teal">puls</span>
          <span className="text-slate-600">/</span>
          <span>arena</span>
        </div>
        <button
          onClick={onOpenPalette}
          className="flex-1 relative max-w-xl text-left group"
          title="Open command palette (⌘K)"
        >
          <Search className="size-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-teal transition-colors" />
          <span className="block w-full bg-white/5 border border-glass-border rounded-md py-1.5 pl-9 pr-16 text-xs text-slate-500 group-hover:border-teal/40 transition-colors">
            Search markets, agents, actions…
          </span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-mono text-slate-400 border border-glass-border rounded px-1.5 py-0.5 bg-white/5">
            <Command className="size-2.5" /> K
          </span>
        </button>
        <div className="hidden md:flex items-center gap-3 font-mono text-[10px] text-slate-500 uppercase tracking-wider ml-auto">
          <button onClick={onStartTour} className="flex items-center gap-1.5 hover:text-teal">
            <BookOpen className="size-3" />
            Tour · ?
          </button>
          <button onClick={onOpenAlerts} className="flex items-center gap-1.5 hover:text-teal">
            <Radio className="size-3" />
            Alerts
            {unseenAlerts > 0 && (
              <span className="ml-0.5 px-1 rounded bg-pink/20 text-pink normal-case">
                {unseenAlerts}
              </span>
            )}
          </button>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-teal animate-pulse" />
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================ MARKETS ============================ */

function CategoryBadge({ cat }: { cat: NormalizedMarket["category"] }) {
  const map: Record<NormalizedMarket["category"], string> = {
    MACRO: "bg-pink/10 text-pink border-pink/20",
    CRYPTO: "bg-teal/10 text-teal border-teal/20",
    POLITICS: "bg-[color:var(--color-warn)]/10 text-[color:var(--color-warn)] border-[color:var(--color-warn)]/20",
    DEFI: "bg-[color:var(--color-purple)]/10 text-[color:var(--color-purple)] border-[color:var(--color-purple)]/20",
    SPORTS: "bg-[color:var(--color-good)]/10 text-[color:var(--color-good)] border-[color:var(--color-good)]/20",
    OTHER: "bg-white/5 text-slate-400 border-glass-border",
  };
  return (
    <span
      className={
        "text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider " +
        map[cat]
      }
    >
      {cat}
    </span>
  );
}

function MarketRow({
  market,
  active,
  onClick,
}: {
  market: NormalizedMarket;
  active: boolean;
  onClick: () => void;
}) {
  const bullish = market.yesPrice >= 0.5;
  return (
    <button
      onClick={onClick}
      className={
        "w-full text-left p-3 rounded-xl border backdrop-blur-md transition-all duration-200 group " +
        (active
          ? "bg-teal/5 border-teal/40 shadow-[0_0_24px_rgba(45,212,191,0.15)]"
          : "bg-glass border-glass-border hover:border-teal/30 hover:bg-white/[0.04] hover:shadow-[0_0_16px_rgba(45,212,191,0.1)]")
      }
    >
      <div className="flex items-center justify-between mb-2">
        <CategoryBadge cat={market.category} />
        <span className="text-[9px] font-mono text-slate-500">{market.ticker}</span>
      </div>
      <p className="text-[12.5px] leading-snug text-white font-medium mb-2 line-clamp-2">
        {market.question}
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className={
                "font-mono text-sm font-semibold " + (bullish ? "text-teal" : "text-pink")
              }
            >
              {(market.yesPrice * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">YES</span>
          </div>
          <div className="h-1 mt-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className={"h-full " + (bullish ? "bg-teal" : "bg-pink")}
              style={{ width: `${market.yesPrice * 100}%` }}
            />
          </div>
        </div>
        <Sparkline data={market.history} color={bullish ? "#2DD4BF" : "#EC4899"} />
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-500">
        <span>Vol {fmtUsd(market.volume)}</span>
        <span>Liq {fmtUsd(market.liquidity)}</span>
      </div>
    </button>
  );
}

/* ============================ ARENA ============================ */

function ArenaSkeleton() {
  return (
    <GlassCard className="p-6 h-64 animate-pulse">
      <div className="h-4 w-32 bg-white/10 rounded mb-3" />
      <div className="h-6 w-2/3 bg-white/10 rounded mb-6" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-xl" />
      </div>
    </GlassCard>
  );
}

function Arena({ market }: { market: NormalizedMarket }) {
  return (
    <GlassCard className="p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <CategoryBadge cat={market.category} />
          <span className="text-[10px] font-mono text-slate-500">{market.ticker}</span>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <Timer className="size-3 text-teal" />
            {market.deadline || "—"}
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-white leading-tight text-balance mb-6">
          {market.question}
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-4 rounded-xl border border-teal/30 bg-teal/5 relative overflow-hidden">
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-teal uppercase tracking-widest mb-1">
                  YES
                </p>
                <p className="font-mono text-3xl text-white font-semibold">
                  ${market.yesPrice.toFixed(2)}
                </p>
                <p className="text-[10px] text-teal/70 font-mono mt-0.5">
                  {(market.yesPrice * 100).toFixed(1)}% implied
                </p>
              </div>
              <TrendingUp className="size-8 text-teal/40" />
            </div>
          </div>
          <div className="p-4 rounded-xl border border-pink/30 bg-pink/5 relative overflow-hidden">
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-pink uppercase tracking-widest mb-1">
                  NO
                </p>
                <p className="font-mono text-3xl text-white font-semibold">
                  ${(1 - market.yesPrice).toFixed(2)}
                </p>
                <p className="text-[10px] text-pink/70 font-mono mt-0.5">
                  {((1 - market.yesPrice) * 100).toFixed(1)}% implied
                </p>
              </div>
              <TrendingDown className="size-8 text-pink/40" />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">
            <span>Consensus</span>
            <span>Polymarket · Arc bridge</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-teal/70 to-teal"
              style={{ width: `${market.yesPrice * 100}%` }}
            />
            <div
              className="bg-gradient-to-r from-pink to-pink/70"
              style={{ width: `${(1 - market.yesPrice) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 pt-4 border-t border-glass-border">
          <MiniKpi label="Volume" value={fmtUsd(market.volume)} />
          <MiniKpi label="Liquidity" value={fmtUsd(market.liquidity)} />
          <MiniKpi label="Slug" value={market.ticker} />
          <MiniKpi label="Status" value={market.raw.closed ? "closed" : "active"} />
        </div>

        <div className="flex items-center gap-2 mt-5">
          <a
            href={`https://app.pulsmarket.tech/m/${market.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal text-navy font-bold text-xs uppercase tracking-wider hover:bg-teal/90 transition-all shadow-[0_0_24px_rgba(45,212,191,0.35)]"
          >
            <ArrowUpRight className="size-3.5" />
            Show market
          </a>
          <button className="px-4 py-2.5 rounded-lg border border-glass-border bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors flex items-center gap-2">
            <Bot className="size-3.5 text-teal" />
            Delegate to agent
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-sm font-mono text-white font-medium truncate">{value}</p>
    </div>
  );
}

/* ============================ PANELS ============================ */

function PnLPanel({ market }: { market: NormalizedMarket }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-3.5 text-teal" />
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
            Price · simulated
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">history API soon</span>
      </div>
      <AreaChart data={market.history} />
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div>
          <p className="text-[9px] font-mono text-slate-500 uppercase">Open</p>
          <p className="text-xs font-mono text-white">{market.history[0].toFixed(3)}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-slate-500 uppercase">High</p>
          <p className="text-xs font-mono text-teal">{Math.max(...market.history).toFixed(3)}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-slate-500 uppercase">Low</p>
          <p className="text-xs font-mono text-pink">{Math.min(...market.history).toFixed(3)}</p>
        </div>
      </div>
    </GlassCard>
  );
}

function OrderBookComingSoon() {
  return (
    <GlassCard className="p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Waves className="size-3.5 text-teal" />
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
            Order Book
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[color:var(--color-warn)]">preview</span>
      </div>
      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <div className="size-12 rounded-xl border border-teal/30 bg-teal/5 flex items-center justify-center">
          <Waves className="size-5 text-teal" />
        </div>
        <p className="text-xs text-slate-300">Order book visualization coming soon.</p>
        <p className="text-[10px] font-mono text-slate-500 max-w-[220px]">
          Depth-of-book stream will render bids · asks · last match in real time.
        </p>
      </div>
    </GlassCard>
  );
}

function X402Panel() {
  const { data, isLoading } = useX402(10);
  const payments = data?.payments ?? [];
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="size-3.5 text-[color:var(--color-purple)]" />
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
            x402 Flow
          </h3>
        </div>
        <span className="text-[10px] font-mono text-teal flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-teal animate-pulse" />
          streaming
        </span>
      </div>
      <div className="space-y-1.5 font-mono text-[10px]">
        {isLoading && <p className="text-slate-500 py-4 text-center">Loading receipts…</p>}
        {!isLoading && payments.length === 0 && (
          <p className="text-slate-500 py-4 text-center">No recent x402 payments.</p>
        )}
        {payments.slice(0, 8).map((p) => (
          <a
            key={p.id}
            href={p.arcscanUrl ?? "#"}
            target={p.arcscanUrl ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-center justify-between p-1.5 rounded bg-white/[0.02] border border-glass-border hover:border-[color:var(--color-purple)]/40 transition-colors animate-[x402-flash_1s_ease-out] hover:animate-none"
          >
            <span className="text-[color:var(--color-purple)] truncate max-w-[100px]" title={p.from}>
              {p.from}
            </span>
            <ArrowUpRight className="size-3 text-slate-600 shrink-0" />
            <span className="text-slate-300 truncate max-w-[100px]" title={p.to}>
              {p.to}
            </span>
            <span className="text-white tabular-nums">{fmtUsd(p.amountUsdc)}</span>
            <span className="text-slate-600 text-[9px]">{relTime(p.createdAt)}</span>
          </a>
        ))}
      </div>
    </GlassCard>
  );
}

function ResolutionTimeline({ market }: { market: NormalizedMarket }) {
  const closed = market.raw.closed;
  const steps = [
    { label: "Proposed", done: true },
    { label: "Liquidity", done: (market.liquidity || 0) > 0 },
    { label: "Trading", done: !closed, active: !closed },
    { label: "Oracle", done: false },
    { label: "Settled", done: !!closed },
  ];
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="size-3.5 text-teal" />
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
            Resolution
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{market.deadline || "—"}</span>
      </div>
      <div className="relative pt-2">
        <div className="absolute left-2 top-4 bottom-4 w-px bg-glass-border" />
        <ul className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 relative">
              <div
                className={
                  "size-4 rounded-full border-2 relative z-10 " +
                  (s.done
                    ? "bg-teal border-teal shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                    : "bg-navy border-glass-border")
                }
              >
                {s.active && (
                  <div className="absolute inset-0 rounded-full bg-teal animate-ping" />
                )}
              </div>
              <span
                className={"text-xs " + (s.done ? "text-white font-medium" : "text-slate-500")}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}

/* ============================ SWARM + DECISIONS ============================ */

function SwarmVisualizer() {
  const { data } = useRoster();
  const { data: feedData } = useFeed(10);
  const agents = data?.agents ?? [];
  const count = agents.length || 8;
  
  // Agent avatar mapping
  const avatarMap: Record<string, string> = {
    vega: "/Vega-pfp.png",
    cygnus: "/Cygnus-pfp.png",
    orion: "/orion-pfp.png",
    atlas: "/atlas-pfp.png",
    nova: "/nova-pfp.png",
    striker: "/striker-pfp.png",
    pulse: "/pulse-pfp.png",
    sage: "/sage-pfp.png",
  };
  
  const nodes = useMemo(
    () =>
      Array.from({ length: Math.max(6, count) }, (_, i) => {
        const angle = (i / Math.max(6, count)) * Math.PI * 2 - Math.PI / 2;
        const r = 52;
        const agent = agents[i];
        const key = agent?.key?.toLowerCase() ?? `agent-${i}`;
        return {
          x: 90 + Math.cos(angle) * r,
          y: 90 + Math.sin(angle) * r,
          name: agent?.name?.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim() ?? `Agent ${i}`,
          avatar: avatarMap[key] ?? "/logo.png",
          color: i % 3 === 0 ? "#2DD4BF" : i % 3 === 1 ? "#EC4899" : "#A78BFA",
          idx: i,
        };
      }),
    [count, agents],
  );

  // Generate payment animation lines — continuous flow + on new events
  const [paymentLines, setPaymentLines] = useState<Array<{from: number; to: number; id: string}>>([]);
  useEffect(() => {
    if (nodes.length < 2) return;
    // Continuous particle flow every 2.5s
    const interval = setInterval(() => {
      const from = Math.floor(Math.random() * nodes.length);
      let to = Math.floor(Math.random() * nodes.length);
      if (to === from) to = (to + 1) % nodes.length;
      setPaymentLines((prev) => [...prev.slice(-6), { from, to, id: `flow-${Date.now()}-${Math.random()}` }]);
    }, 2500);
    return () => clearInterval(interval);
  }, [nodes.length]);
  // Also trigger on new feed events
  useEffect(() => {
    if (!feedData?.events?.length || nodes.length < 2) return;
    const from = Math.floor(Math.random() * nodes.length);
    let to = Math.floor(Math.random() * nodes.length);
    if (to === from) to = (to + 1) % nodes.length;
    setPaymentLines((prev) => [...prev.slice(-6), { from, to, id: `evt-${Date.now()}` }]);
  }, [feedData?.events?.length, nodes.length]);

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkle className="size-3.5 text-teal" />
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
            Swarm
          </h3>
        </div>
        <span className="text-[10px] font-mono text-teal">{count} agents</span>
      </div>
      <div className="relative aspect-square">
        <svg viewBox="0 0 180 180" className="w-full h-full">
          {/* Mesh rings */}
          {[35, 55].map((r) => (
            <circle
              key={r}
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke="rgba(45,212,191,0.06)"
              strokeDasharray="2 4"
            />
          ))}
          {/* Connection lines between all agents */}
          {nodes.map((n, i) =>
            nodes.slice(i + 1).map((m, j) => (
              <line
                key={`conn-${i}-${i + j + 1}`}
                x1={n.x}
                y1={n.y}
                x2={m.x}
                y2={m.y}
                stroke="rgba(45,212,191,0.08)"
                strokeWidth="0.5"
              />
            )),
          )}
          {/* Payment animation lines */}
          {paymentLines.map((pl) => {
            const fromNode = nodes[pl.from];
            const toNode = nodes[pl.to];
            if (!fromNode || !toNode) return null;
            return (
              <g key={pl.id}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#2DD4BF"
                  strokeWidth="1.5"
                  opacity="0.8"
                >
                  <animate attributeName="opacity" values="0.8;0" dur="2s" fill="freeze" />
                </line>
                <circle r="3" fill="#2DD4BF">
                  <animateMotion
                    dur="1.5s"
                    fill="freeze"
                    path={`M${fromNode.x},${fromNode.y} L${toNode.x},${toNode.y}`}
                  />
                  <animate attributeName="opacity" values="1;0" dur="1.5s" fill="freeze" />
                </circle>
              </g>
            );
          })}
          {/* Center hub */}
          <circle cx="90" cy="90" r="6" fill="#2DD4BF" opacity="0.1" />
          <circle cx="90" cy="90" r="3" fill="#2DD4BF">
            <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
          </circle>
          {/* Agent nodes */}
          {nodes.map((n, i) => (
            <g key={"node" + i}>
              {/* Glow */}
              <circle cx={n.x} cy={n.y} r="12" fill={n.color} opacity="0.08" />
              {/* Avatar circle */}
              <clipPath id={`clip-agent-${i}`}>
                <circle cx={n.x} cy={n.y} r="9" />
              </clipPath>
              <circle cx={n.x} cy={n.y} r="9" fill="#0F1629" stroke={n.color} strokeWidth="1" opacity="0.9" />
              <image
                href={n.avatar}
                x={n.x - 9}
                y={n.y - 9}
                width="18"
                height="18"
                clipPath={`url(#clip-agent-${i})`}
                style={{ borderRadius: "50%" }}
              />
              {/* Pulse on active */}
              <circle cx={n.x} cy={n.y} r="9" fill="none" stroke={n.color} strokeWidth="0.5">
                <animate attributeName="r" values="9;14;9" dur={`${3 + (i % 2)}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur={`${3 + (i % 2)}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
        </svg>
        {/* Agent name labels */}
        <div className="absolute inset-0 pointer-events-none">
          {nodes.map((n, i) => (
            <span
              key={`label-${i}`}
              className="absolute text-[7px] font-mono text-slate-400 whitespace-nowrap"
              style={{
                left: `${(n.x / 180) * 100}%`,
                top: `${(n.y / 180) * 100 + 8}%`,
                transform: "translateX(-50%)",
              }}
            >
              {n.name}
            </span>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-2 text-center text-[9px] font-mono text-slate-500 uppercase tracking-widest">
          {count} nodes · x402 mesh · Arc
        </div>
      </div>
    </GlassCard>
  );
}

function DecisionLog() {
  const { data, isLoading } = useFeed(20);
  const events = data?.events ?? [];
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="size-3.5 text-teal" />
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
            Decision Stream
          </h3>
        </div>
        <span className="text-[10px] font-mono text-teal flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-teal animate-pulse" />
          live
        </span>
      </div>
      <ul className="space-y-1.5 font-mono text-[10.5px] max-h-[420px] overflow-y-auto pr-1">
        {isLoading && <li className="text-slate-500 text-center py-4">Loading…</li>}
        {events.map((e, i) => (
          <DecisionRow key={i} e={e} />
        ))}
      </ul>
    </GlassCard>
  );
}

function DecisionRow({ e }: { e: FeedEvent }) {
  const tone = feedTone(e.action);
  const name = e.agentName || e.agentKey || "agent";
  const question = e.question || "";
  const side = e.side;
  return (
    <li className="flex items-start gap-2 p-1.5 rounded hover:bg-white/[0.03] transition-colors animate-[slide-in-up_0.3s_ease-out]">
      <span className="text-slate-600 tabular-nums shrink-0">{relTime(e.at)}</span>
      <span
        className={
          "shrink-0 px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-widest " +
          tone.className
        }
      >
        {tone.label}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white truncate">
          <span className="font-semibold">{name}</span>
          {side && (
            <span className={side === "YES" ? "text-teal ml-1.5" : "text-pink ml-1.5"}>
              {side}
            </span>
          )}
          {typeof e.amount === "number" && (
            <span className="text-slate-400 ml-1.5">${e.amount.toFixed(3)}</span>
          )}
        </p>
        {question && (
          <p className="text-slate-500 leading-tight truncate">{question}</p>
        )}
      </div>
    </li>
  );
}

/* ============================ AGENT ROSTER ============================ */

function AgentRoster() {
  const { data, isLoading } = useRoster();
  const { data: pnlData } = usePnl();
  const agents = data?.agents ?? [];
  const pnlMap = useMemo(() => {
    const m = new Map<string, number>();
    pnlData?.agents.forEach((a) => {
      const key = a.agent.replace(/^agent_swarm_/, "");
      m.set(key, a.net);
    });
    return m;
  }, [pnlData]);

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="size-3.5 text-teal" />
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
            Agent Roster
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{agents.length} live agents</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {isLoading && <SkeletonRows n={4} />}
        {agents.map((a) => {
          const net = pnlMap.get(a.key) ?? 0;
          const positive = net >= 0;
          const emoji = emojiFor(a.name);
          const lastDecision = a.recentDecisions?.[0];
          const balanceStr = `$${(a.balance ?? 0).toFixed(2)}`;
          return (
            <div
              key={a.key}
              className="p-3 rounded-lg border border-glass-border bg-white/[0.02] hover:border-teal/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="size-9 rounded-lg flex items-center justify-center text-base bg-teal/15 text-teal">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white truncate">{a.name}</p>
                    <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">
                      · {a.role}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {shortAddr(a.address)} · {a.brain}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full animate-pulse bg-teal" />
                  <span className="text-[9px] font-mono text-slate-400 uppercase">live</span>
                </div>
              </div>
              <p className="text-[10.5px] italic text-slate-400 mb-2 leading-snug line-clamp-2">
                "{lastDecision?.reasoning || a.strategy}"
              </p>
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-glass-border">
                <MiniKpi label="Balance" value={balanceStr} />
                <MiniKpi
                  label="Net"
                  value={`${positive ? "+" : ""}${fmtUsd(net)}`}
                />
                <MiniKpi
                  label="Last"
                  value={relTime(lastDecision?.at) || "—"}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function BondSlashPanel() {
  const { data, isLoading } = useBonds();
  const bonds = data?.bonds ?? [];
  const stats = data?.stats;
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="size-3.5 text-teal" />
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
            Bond · Slash
          </h3>
        </div>
        {stats && (
          <span className="text-[10px] font-mono text-slate-500">
            {fmtUsd(stats.activeUsdc)} active
          </span>
        )}
      </div>
      {stats && (
        <div className="grid grid-cols-3 gap-1 mb-3 pb-3 border-b border-glass-border">
          <MiniKpi label="Bonded" value={fmtUsd(stats.bondedUsdc)} />
          <MiniKpi label="Slashed" value={fmtUsd(stats.slashedUsdc)} />
          <MiniKpi label="Returned" value={fmtUsd(stats.returnedUsdc)} />
        </div>
      )}
      <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {isLoading && <li className="text-[11px] text-slate-500 text-center py-4">Loading…</li>}
        {bonds.slice(0, 8).map((b) => {
          const slash = b.status === "slashed" || b.correct === false;
          const type = slash ? "SLASH" : "BOND";
          return (
            <li
              key={b.signalId}
              className={`flex items-start gap-2 p-2 rounded-md bg-white/[0.02] border border-glass-border ${
                slash ? "animate-[flash-red_1s_ease-out]" : "animate-[flash-green_1s_ease-out]"
              }`}
            >
              <span
                className={
                  "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase " +
                  (slash
                    ? "bg-[color:var(--color-bad)]/15 text-[color:var(--color-bad)] border border-[color:var(--color-bad)]/30"
                    : "bg-[color:var(--color-warn)]/15 text-[color:var(--color-warn)] border border-[color:var(--color-warn)]/30")
                }
              >
                {type}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-white font-medium truncate">{b.agentName}</p>
                  <p
                    className={
                      "text-xs font-mono shrink-0 " +
                      (slash ? "text-[color:var(--color-bad)]" : "text-teal")
                    }
                  >
                    {slash ? "−" : "+"}
                    {fmtUsd(b.amountUsdc)}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 truncate">
                  {b.stance} · {b.title}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}

function DuelsPanel() {
  const { data, isLoading } = useDuels();
  const duels = data?.duels ?? [];
  const stats = data?.stats;
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="size-3.5 text-teal" />
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">
            Agent Duels
          </h3>
        </div>
        <span className="text-[10px] font-mono text-teal flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-teal animate-pulse" />
          {stats?.activeDuels ?? 0} active
        </span>
      </div>
      <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {isLoading && <li className="text-[11px] text-slate-500 text-center py-4">Loading…</li>}
        {duels.slice(0, 6).map((d) => (
          <li
            key={d.id}
            className="p-2.5 rounded-md bg-teal/[0.04] border border-teal/20"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase truncate max-w-[130px]">
                {d.marketSlug}
              </span>
              <span className="text-[10px] font-mono text-teal font-bold">
                {fmtUsd(d.stakeYesUsdc + d.stakeNoUsdc)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-teal font-semibold truncate">{d.agentYes.name}</span>
              <span className="text-slate-600 font-mono text-[9px]">vs</span>
              <span className="text-pink font-semibold truncate">{d.agentNo.name}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">{d.status}</p>
          </li>
        ))}
        {!isLoading && duels.length === 0 && (
          <p className="text-[11px] font-mono text-slate-500 text-center py-4">
            No live duels.
          </p>
        )}
      </ul>
      <p className="text-[9px] font-mono text-slate-600 mt-2 text-center uppercase tracking-widest">
        Arb scanner · coming soon
      </p>
    </GlassCard>
  );
}

/* ============================ CHARTS ============================ */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 60;
  const h = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-5 shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

function AreaChart({ data }: { data: number[] }) {
  const w = 300;
  const h = 90;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 10) - 5;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `M0,${h} L${line.split(" ").join(" L")} L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
      <defs>
        <linearGradient id="pnlfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="0"
          x2={w}
          y1={(h / 4) * i + 5}
          y2={(h / 4) * i + 5}
          stroke="rgba(255,255,255,0.04)"
        />
      ))}
      <path d={area} fill="url(#pnlfill)" />
      <polyline
        fill="none"
        stroke="#2DD4BF"
        strokeWidth="1.5"
        strokeLinecap="round"
        points={line}
      />
      {pts.length > 0 && (
        <circle
          cx={pts[pts.length - 1][0]}
          cy={pts[pts.length - 1][1]}
          r="2.5"
          fill="#2DD4BF"
        />
      )}
    </svg>
  );
}

/* ============================ LIVE TICKER ============================ */

function LiveTicker() {
  const { data } = useFeed(10);
  const events = data?.events ?? [];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-navy/90 backdrop-blur-xl border-t border-glass-border z-40 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 h-10 flex items-center gap-0">
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0 pr-4 z-10 bg-navy/90">
          <span className="size-1.5 bg-pink rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">
            Live Tape
          </span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {/* Left fade mask */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-navy/90 to-transparent z-10 pointer-events-none" />
          {/* Right fade mask */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-navy/90 to-transparent z-10 pointer-events-none" />
          <div className="flex items-center gap-6 text-[11px] font-mono whitespace-nowrap animate-[marquee_40s_linear_infinite]" style={{ width: "max-content" }}>
            {events.length === 0 && <span className="text-slate-600">Waiting for feed…</span>}
            {[...events.slice(0, 8), ...events.slice(0, 8)].map((e, i) => {
              const tone = feedTone(e.action);
              const name = e.agentName || e.agentKey || "agent";
              return (
                <span key={i} className="flex items-center gap-2 shrink-0 animate-[glow-text_4s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.3}s` }}>
                  <span
                    className={
                      "text-[9px] font-bold px-1 py-0.5 rounded " + tone.className
                    }
                  >
                    {tone.label}
                  </span>
                  <span className="text-white">{name}</span>
                  {e.side && (
                    <span className={e.side === "YES" ? "text-teal" : "text-pink"}>
                      {e.side}
                    </span>
                  )}
                  {typeof e.amount === "number" && (
                    <span className="text-slate-400">${e.amount.toFixed(3)}</span>
                  )}
                  <span className="text-slate-600">· {relTime(e.at)}</span>
                  <span className="text-slate-700 mx-1">│</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

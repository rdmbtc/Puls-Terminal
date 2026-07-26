import { useQuery } from "@tanstack/react-query";

export const API_BASE = "https://api.pulsmarket.tech";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

/* ============================ Types ============================ */

export type Stats = {
  trades: number;
  volumeUsdc: number;
  totalVolumeUsdc: number;
  marketsDeployed: number;
  marketsResolved: number;
  users: number;
  humanTrades: number;
  agentTrades: number;
  agents: number;
  humanVolumeUsdc: number;
  agentVolumeUsdc: number;
  nanopayments: { count: number; volumeUsdc: number };
  updatedAt: string;
};

export type RawMarket = {
  id: string;
  question: string;
  slug: string;
  endDate?: string;
  liquidity?: string;
  outcomes?: string;
  outcomePrices?: string;
  volume?: string;
  volumeNum?: number;
  liquidityNum?: number;
  image?: string;
  icon?: string;
  description?: string;
  active?: boolean;
  closed?: boolean;
  category?: string;
};

export type NormalizedMarket = {
  slug: string;
  ticker: string;
  question: string;
  deadline: string;
  yesPrice: number;
  delta: number;
  volume: number;
  liquidity: number;
  category: "MACRO" | "CRYPTO" | "POLITICS" | "DEFI" | "SPORTS" | "OTHER";
  history: number[];
  agents: string[];
  raw: RawMarket;
};

export type AgentRoster = {
  key: string;
  name: string;
  role: string;
  brain: string;
  persona: string;
  strategy: string;
  address: string;
  balance: number;
  recentDecisions?: Array<{ reasoning?: string; at?: string; question?: string; side?: string }>;
};

export type FeedEvent = {
  agentKey?: string;
  agentName?: string;
  action?: string;
  question?: string;
  side?: string;
  amount?: number;
  reasoning?: string;
  txHash?: string | null;
  slug?: string | null;
  marketSlug?: string | null;
  at: string;
  ratePerSecUsdc?: number | null;
  streamedUsdc?: number | null;
  role?: string;
};

export type X402Payment = {
  id: string;
  type: string;
  from: string;
  to: string;
  amountUsdc: number;
  memo?: string;
  txHash?: string | null;
  arcscanUrl?: string | null;
  status?: string;
  createdAt: string;
};

export type Duel = {
  id: string;
  marketSlug: string;
  marketQuestion: string;
  agentYes: { name: string };
  agentNo: { name: string };
  stakeYesUsdc: number;
  stakeNoUsdc: number;
  status: string;
};

export type Bond = {
  signalId: string;
  agent: string;
  agentName: string;
  title: string;
  market: string;
  stance: string;
  amountUsdc: number;
  status: string;
  correct: boolean | null;
};

export type PnlAgent = { agent: string; revenue: number; costs: number; net: number };

export type Health = {
  ok: boolean;
  uptimeSec: number;
  memory: { heapUsedMb: number; heapTotalMb: number; rssMb: number };
  cpus: number;
  load1: number;
  eventLoopLagMs: number;
  circuitBreakers?: Record<string, { isOpen: boolean }>;
};

/* ============================ Normalizers ============================ */

const emojiFor = (name: string) => {
  const m = name.match(/([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/u);
  return m?.[1] || "🤖";
};

const inferCategory = (q: string): NormalizedMarket["category"] => {
  const t = q.toLowerCase();
  if (/(btc|eth|sol|crypto|token|blockchain|defi|bitcoin|ethereum)/.test(t)) return "CRYPTO";
  if (/(fed|rate|inflation|recession|gdp|jobs|nfp|macro)/.test(t)) return "MACRO";
  if (/(election|president|senate|trump|biden|congress|vote)/.test(t)) return "POLITICS";
  if (/(tvl|liquidity|amm|dex|staking)/.test(t)) return "DEFI";
  if (/(match|cup|vs\.|nba|nfl|mlb|goal|score|league|soccer|football|championship)/.test(t))
    return "SPORTS";
  return "OTHER";
};

const tickerFrom = (slug: string) => {
  const parts = slug.split("-").filter(Boolean).slice(0, 3).join("-").toUpperCase();
  return parts.length > 22 ? parts.slice(0, 22) + "…" : parts;
};

const daysUntil = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.round((d - now) / 86400000);
  const nice = new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (days > 0) return `${nice} · ${days}d`;
  if (days === 0) return `${nice} · today`;
  return `${nice} · closed`;
};

const genHistory = (yesPrice: number) =>
  Array.from({ length: 24 }, (_, i) => {
    const t = i / 24;
    return Math.max(
      0.02,
      Math.min(0.98, yesPrice + Math.sin(t * 6) * 0.05 + (Math.random() - 0.5) * 0.04),
    );
  });

export function normalizeMarket(m: RawMarket): NormalizedMarket {
  let yesPrice = 0.5;
  try {
    if (m.outcomePrices) {
      const arr = JSON.parse(m.outcomePrices) as string[];
      const p = parseFloat(arr[0]);
      if (!Number.isNaN(p)) yesPrice = p;
    }
  } catch {
    /* ignore */
  }
  const volume = m.volumeNum ?? (parseFloat(m.volume || "0") || 0);
  const liquidity = m.liquidityNum ?? (parseFloat(m.liquidity || "0") || 0);
  return {
    slug: m.slug,
    ticker: tickerFrom(m.slug),
    question: m.question,
    deadline: daysUntil(m.endDate),
    yesPrice,
    delta: 0,
    volume,
    liquidity,
    category: inferCategory(m.question),
    history: genHistory(yesPrice),
    agents: ["⚡", "🪐", "🔭"],
    raw: m,
  };
}

/* ============================ Hooks ============================ */

const opts = (staleMs: number, refetchMs: number) => ({
  staleTime: staleMs,
  refetchInterval: refetchMs,
  refetchOnWindowFocus: false as const,
});

export const useStats = () =>
  useQuery({ queryKey: ["puls", "stats"], queryFn: () => get<Stats>("/api/stats"), ...opts(5_000, 15_000) });

export const useMarkets = (limit = 12) =>
  useQuery({
    queryKey: ["puls", "markets", limit],
    queryFn: async () => {
      const raw = await get<RawMarket[]>(`/api/markets?limit=${limit}`);
      return raw.map(normalizeMarket);
    },
    ...opts(20_000, 30_000),
  });

export const useRoster = () =>
  useQuery({
    queryKey: ["puls", "roster"],
    queryFn: () => get<{ agents: AgentRoster[] }>("/api/agents/roster"),
    ...opts(30_000, 60_000),
  });

export const useFeed = (limit = 24) =>
  useQuery({
    queryKey: ["puls", "feed", limit],
    queryFn: () => get<{ events: FeedEvent[] }>(`/api/agents/feed?limit=${limit}`),
    ...opts(3_000, 8_000),
  });

export const useX402 = (limit = 10) =>
  useQuery({
    queryKey: ["puls", "x402", limit],
    queryFn: () => get<{ payments: X402Payment[] }>(`/api/x402/payments?limit=${limit}`),
    ...opts(5_000, 12_000),
  });

export const useDuels = () =>
  useQuery({
    queryKey: ["puls", "duels"],
    queryFn: () => get<{ duels: Duel[]; stats: { activeDuels: number; totalDuels: number; dueledUsdc: number } }>("/api/agents/duels"),
    ...opts(15_000, 30_000),
  });

export const useBonds = () =>
  useQuery({
    queryKey: ["puls", "bonds"],
    queryFn: () => get<{ bonds: Bond[]; stats: { bondedUsdc: number; slashedUsdc: number; activeUsdc: number; returnedUsdc: number } }>("/api/agents/bonds"),
    ...opts(15_000, 30_000),
  });

export const usePnl = () =>
  useQuery({
    queryKey: ["puls", "pnl"],
    queryFn: () => get<{ agents: PnlAgent[] }>("/api/agents/pnl"),
    ...opts(30_000, 60_000),
  });

export const useHealth = () =>
  useQuery({
    queryKey: ["puls", "health"],
    queryFn: () => get<Health>("/api/health"),
    ...opts(10_000, 20_000),
  });

/* ============================ Formatters ============================ */

export const fmtUsd = (n: number) => {
  if (!isFinite(n)) return "$—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
};

export const fmtNum = (n: number) => {
  if (!isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
};

export const shortAddr = (a?: string) =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";

export const relTime = (iso?: string) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.max(1, Math.round(diff))}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}d`;
};

export { emojiFor };

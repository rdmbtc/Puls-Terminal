export type Market = {
  slug: string;
  ticker: string;
  question: string;
  deadline: string;
  yesPrice: number;
  delta: number;
  volume: number;
  liquidity: number;
  agents: string[];
  category: "MACRO" | "CRYPTO" | "POLITICS" | "DEFI";
  history: number[];
};

export type Agent = {
  name: string;
  emoji: string;
  role: string;
  address: string;
  weeklyPnl: number;
  winRate: number;
  trades: number;
  balance: number;
  color: "teal" | "pink" | "amber";
  history: number[];
  status: "active" | "idle" | "hedging";
  latestThought: string;
};

const genSpark = (base: number, vol: number, len = 24) =>
  Array.from({ length: len }, (_, i) => {
    const t = i / len;
    return base + Math.sin(t * 8) * vol + (Math.random() - 0.5) * vol * 0.6;
  });

export const markets: Market[] = [
  {
    slug: "btc-100k",
    ticker: "BTC-100K.AUG",
    question: "Will BTC hit $100k by August?",
    deadline: "31 Aug 2026 · 14d",
    yesPrice: 0.67,
    delta: 4.2,
    volume: 245200,
    liquidity: 82400,
    agents: ["⚡", "🪐", "🌠"],
    category: "CRYPTO",
    history: genSpark(0.6, 0.08),
  },
  {
    slug: "eth-flip",
    ticker: "ETH-ATH.SEP",
    question: "Will ETH flip its all-time high?",
    deadline: "15 Sep 2026 · 29d",
    yesPrice: 0.31,
    delta: -2.1,
    volume: 112800,
    liquidity: 41200,
    agents: ["💠", "🌠"],
    category: "CRYPTO",
    history: genSpark(0.35, 0.06),
  },
  {
    slug: "us-recession",
    ticker: "US-REC.2026",
    question: "US recession declared in 2026?",
    deadline: "31 Dec 2026 · 137d",
    yesPrice: 0.18,
    delta: 0.4,
    volume: 210000,
    liquidity: 96500,
    agents: ["🛰️", "🪐"],
    category: "MACRO",
    history: genSpark(0.2, 0.05),
  },
  {
    slug: "fed-cut-jul",
    ticker: "FED-CUT.JUL",
    question: "Fed cuts rates in July?",
    deadline: "31 Jul 2026 · 5d",
    yesPrice: 0.74,
    delta: 6.8,
    volume: 156000,
    liquidity: 58900,
    agents: ["⚡", "🌠", "🪐"],
    category: "MACRO",
    history: genSpark(0.7, 0.05),
  },
  {
    slug: "arc-tvl-1b",
    ticker: "ARC-TVL.Q4",
    question: "Arc TVL exceeds $1B by Q4?",
    deadline: "31 Dec 2026",
    yesPrice: 0.42,
    delta: 1.9,
    volume: 67000,
    liquidity: 22300,
    agents: ["🪐", "💠"],
    category: "DEFI",
    history: genSpark(0.4, 0.07),
  },
  {
    slug: "sol-300",
    ticker: "SOL-300.AUG",
    question: "SOL above $300 this month?",
    deadline: "31 Aug 2026",
    yesPrice: 0.55,
    delta: -0.8,
    volume: 92000,
    liquidity: 34100,
    agents: ["⚡"],
    category: "CRYPTO",
    history: genSpark(0.55, 0.09),
  },
];

export const agents: Agent[] = [
  {
    name: "Vega",
    emoji: "⚡",
    role: "Momentum",
    address: "0x72c4...4a1d",
    weeklyPnl: 14.2,
    winRate: 78.4,
    trades: 1402,
    balance: 284.5,
    color: "teal",
    history: [40, 60, 50, 80, 70, 90, 100, 92, 105],
    status: "active",
    latestThought: "Executing YES on FED-CUT — 87% liquidity depth aligned.",
  },
  {
    name: "Antigravity",
    emoji: "🪐",
    role: "Contrarian",
    address: "0x9fa8...8b2c",
    weeklyPnl: 8.7,
    winRate: 64.2,
    trades: 943,
    balance: 172.1,
    color: "pink",
    history: [30, 45, 35, 60, 50, 55, 75, 62, 78],
    status: "hedging",
    latestThought: "Hedging BTC-100K downside via NO 0.33 @ 4.2k size.",
  },
  {
    name: "Lyra",
    emoji: "💠",
    role: "Market Maker",
    address: "0x4b1e...c31e",
    weeklyPnl: 5.4,
    winRate: 71.0,
    trades: 812,
    balance: 128.9,
    color: "teal",
    history: [20, 35, 55, 45, 65, 60, 80, 74, 82],
    status: "active",
    latestThought: "Quoting both sides on ETH-ATH — spread compressed to 2bps.",
  },
  {
    name: "Orion",
    emoji: "🛰️",
    role: "Sentinel",
    address: "0x21df...9e04",
    weeklyPnl: -1.8,
    winRate: 58.3,
    trades: 611,
    balance: 61.2,
    color: "amber",
    history: [60, 55, 48, 52, 46, 40, 44, 38, 42],
    status: "idle",
    latestThought: "Watching macro tape — awaiting NFP print for signal.",
  },
];

export const decisionStream = [
  { t: "14:02:11", agent: "Vega ⚡", tone: "teal", text: "OPEN YES · BTC-100K · 1,200 @ 0.67" },
  { t: "14:02:04", agent: "Antigravity 🪐", tone: "pink", text: "OPEN NO · ETH-ATH · 800 @ 0.69" },
  { t: "14:01:52", agent: "Lyra 💠", tone: "teal", text: "QUOTE · FED-CUT · bid 0.735 / ask 0.745" },
  { t: "14:01:41", agent: "Orion 🛰️", tone: "amber", text: "SIGNAL · macro-tape divergence, +0.4σ" },
  { t: "14:01:28", agent: "Vega ⚡", tone: "teal", text: "CLOSE YES · SOL-300 · +2.4 SOL realized" },
  { t: "14:01:03", agent: "Antigravity 🪐", tone: "pink", text: "REBALANCE · ARC-TVL · 30% weight" },
  { t: "14:00:47", agent: "Sirius 🌠", tone: "teal", text: "ARB · Polymarket→Puls spread 2.1% Δ" },
] as const;

export const bondSlashFeed = [
  { type: "SLASH", agent: "Ganymede", amount: -5.0, reason: "Stale quote > 4s" },
  { type: "BOND", agent: "Sirius", amount: +10.0, reason: "Resolver bond posted" },
  { type: "SLASH", agent: "Nemesis", amount: -1.2, reason: "Adverse selection" },
  { type: "BOND", agent: "Vega", amount: +25.0, reason: "Market-maker tier upgrade" },
] as const;

export const arbOpportunities = [
  { pair: "BTC-100K", venueA: "Puls 0.670", venueB: "Polymarket 0.688", edge: 2.1 },
  { pair: "FED-CUT",  venueA: "Puls 0.742", venueB: "Kalshi 0.729",     edge: 1.3 },
] as const;

export const x402Flow = [
  { addr: "0x8f2a...c11", amount: "+4.2 SOL", side: "buy" },
  { addr: "0x1299...9d3", amount: "-1.5 SOL", side: "sell" },
  { addr: "0xcce4...e45", amount: "+12.0 SOL", side: "buy" },
  { addr: "0x4401...012", amount: "+0.2 SOL", side: "buy" },
  { addr: "0x99ff...ff3", amount: "-8.4 SOL", side: "sell" },
  { addr: "0x2ab4...b44", amount: "+2.1 SOL", side: "buy" },
] as const;

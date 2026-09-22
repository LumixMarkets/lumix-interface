// Local chart/activity fixtures and an action journal. No network or wallet dependencies.
import {
  EARN_ASSETS, USD_SCALE, applyEarnAction, createInitialEarnState, earnAssetValue,
  earnPoolValue, parseEarnAmount, type EarnAction, type EarnAssetId, type EarnPool, type EarnState,
} from "./earn-model";

export const EARN_HISTORY_END = Date.UTC(2026, 9, 2, 12) / 1000;
export const EARN_RANGES = ["1D", "1W", "1M", "All"] as const;
export type EarnRange = typeof EARN_RANGES[number];
export type EarnHistoryPoint = { time: number; value: number };
export type EarnSession = { state: EarnState; actions: EarnAction[] };
export type EarnActivity = {
  id: string; time: number; action: "Buy" | "Sell"; asset: EarnAssetId;
  amount: bigint; value: bigint; account: string; yours: boolean;
};

const initialPools = createInitialEarnState().pools;
const sampleVolume = [1246800, 865400, 2158900, 1627800, 1396400, 954800];
const activityUsd = [2500, 860, 12000, 420, 7800, 1750, 3200, 15000, 640, 9200, 2100, 5800, 1250, 4500, 3600, 980];
const accounts = ["GCHNQPFKJALQEBHRKDTWFSZKLVEBYQUPMFDBKSWQEXMHTLNWBSQGA7PQ", "GASJZBPWMHTXEFNQVKYCDRPLZAJNEFQUVSHBWXTEMLPRDCKYVNHQ3KDM", "GDVQEBPLXHZNRWJKTMSAFYCUELHDBQPVNWKZRYTGCFMSHXABJEQL6TWF", "GBNZCTKLEWQDMHFPARXVJUSYHNKQEBWGLCMTZRFPVDXALSYHQKNE5BKR"];
const demoAccount = "GDEMOACCOUNTQVFJHWNLZKPEBCUYSMTRXAFGDQJHLNVZPKEWCUYSA7PQ";

export function createEarnSession(): EarnSession { return { state: createInitialEarnState(), actions: [] }; }

// Persist only validated commands, so BigInts never need lossy JSON conversion.
export function restoreEarnSession(raw: string | null): EarnSession {
  const fresh = createEarnSession();
  if (!raw) return fresh;
  try {
    const data = JSON.parse(raw) as { version?: unknown; actions?: unknown };
    if (data.version !== 1 || !Array.isArray(data.actions) || data.actions.length > 1000) return fresh;
    let state = fresh.state;
    const actions: EarnAction[] = [];
    for (const [index, candidate] of data.actions.entries()) {
      if (!candidate || typeof candidate !== "object") return fresh;
      const action = candidate as EarnAction;
      if (action.id !== `earn-demo-${index + 1}` || typeof action.amount !== "string" ||
          typeof action.poolId !== "string" || !(action.asset in EARN_ASSETS) ||
          (action.mode !== "deposit" && action.mode !== "withdraw")) return fresh;
      const result = applyEarnAction(state, action);
      if (!result.ok) return fresh;
      state = result.state;
      actions.push({ id: action.id, poolId: action.poolId, asset: action.asset, mode: action.mode, amount: action.amount });
    }
    return { state, actions };
  } catch { return fresh; }
}

export function serializeEarnSession(session: EarnSession) {
  return JSON.stringify({ version: 1, actions: session.actions });
}

export function earnRecentActivity(pool: EarnPool, actions: EarnAction[]): EarnActivity[] {
  const poolIndex = initialPools.findIndex((candidate) => candidate.id === pool.id);
  const samples = activityUsd.map((usd, index): EarnActivity => {
    const asset = pool.assets[index % 2];
    const amount = BigInt(usd + poolIndex * 37) * BigInt(100) * BigInt(10) ** BigInt(EARN_ASSETS[asset].precision) / EARN_ASSETS[asset].priceCents;
    return {
      id: `${pool.id}-sample-${index}`, time: EARN_HISTORY_END - (5 + index * 19) * 60,
      action: index % 3 === 0 ? "Sell" : "Buy", asset, amount, value: earnAssetValue(amount, asset),
      account: accounts[(index + poolIndex) % accounts.length], yours: false,
    };
  });
  const submitted = actions.flatMap((action, index): EarnActivity[] => {
    if (action.poolId !== pool.id) return [];
    const parsed = parseEarnAmount(action.amount, action.asset);
    if (!parsed.ok) return [];
    return [{
      id: action.id, time: EARN_HISTORY_END + (index + 1) * 60,
      action: action.mode === "deposit" ? "Buy" : "Sell", asset: action.asset, amount: parsed.units,
      value: earnAssetValue(parsed.units, action.asset), account: demoAccount, yours: true,
    }];
  });
  return [...submitted.reverse(), ...samples];
}

export function earnPoolStatistics(pool: EarnPool) {
  const index = initialPools.findIndex((candidate) => candidate.id === pool.id);
  return {
    deposits: earnPoolValue(pool),
    // Funding a position isn't perpetual trading and doesn't manufacture trading fees.
    volume24h: BigInt(sampleVolume[index]) * USD_SCALE,
    fees24h: earnPoolValue(initialPools[index]) * BigInt(pool.aprBps) / BigInt(10000 * 365),
  };
}

export function earnPoolHistory(pool: EarnPool, actions: EarnAction[], range: EarnRange): EarnHistoryPoint[] {
  const index = initialPools.findIndex((candidate) => candidate.id === pool.id);
  const base = earnPoolValue(initialPools[index]);
  const hours = 90 * 24;
  const factor = (hour: number) => Math.round(850000 + hour / hours * 150000 +
    Math.sin(hour / 23 + index) * 8000 + Math.sin(hour / 3 + index * 2) * 2000);
  const lastFactor = BigInt(factor(hours));
  const points = Array.from({ length: hours + 1 }, (_, hour) => ({
    time: EARN_HISTORY_END - (hours - hour) * 3600,
    value: Number(base * BigInt(factor(hour)) / lastFactor) / Number(USD_SCALE),
  }));
  let total = base;
  actions.forEach((action, actionIndex) => {
    if (action.poolId !== pool.id) return;
    const parsed = parseEarnAmount(action.amount, action.asset);
    if (!parsed.ok) return;
    const value = earnAssetValue(parsed.units, action.asset);
    total += action.mode === "deposit" ? value : -value;
    points.push({ time: EARN_HISTORY_END + (actionIndex + 1) * 60, value: Number(total) / Number(USD_SCALE) });
  });
  const end = points[points.length - 1].time;
  const seconds = range === "1D" ? 86400 : range === "1W" ? 7 * 86400 : range === "1M" ? 30 * 86400 : Infinity;
  return points.filter((point) => point.time >= end - seconds);
}

export function earnHistoryChange(points: EarnHistoryPoint[]) {
  const first = points[0].value;
  const current = points[points.length - 1].value;
  return { current, change: current - first, percent: first === 0 ? 0 : (current - first) / first * 100 };
}

export function shortEarnAccount(account: string) { return `${account.slice(0, 6)}…${account.slice(-4)}`; }

export function formatEarnTimestamp(time: number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(time * 1000);
}

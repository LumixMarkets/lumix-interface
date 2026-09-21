// Deterministic, in-memory demo fixtures. This module has no service or wallet dependencies.
export type EarnAssetId = "XLM" | "USDC" | "USDT0" | "BTC" | "ETH";
export type EarnMode = "deposit" | "withdraw";
export type EarnSort = "deposits" | "apr" | "performance" | "position";
export type EarnAssetFilter = "All" | "USDC" | "USDT0";
export type EarnHoldings = Partial<Record<EarnAssetId, bigint>>;

const ZERO = BigInt(0);
const HUNDRED = BigInt(100);
export const USD_SCALE = BigInt(10) ** BigInt(20);
export const DEMO_PROCESSING_MS = 700;

export const EARN_ASSETS: Record<EarnAssetId, { name: string; precision: number; priceCents: bigint }> = {
  XLM: { name: "Stellar Lumens", precision: 7, priceCents: BigInt(25) },
  USDC: { name: "USD Coin", precision: 7, priceCents: BigInt(100) },
  USDT0: { name: "USDT0", precision: 6, priceCents: BigInt(100) },
  BTC: { name: "Bitcoin", precision: 8, priceCents: BigInt(11000000) },
  ETH: { name: "Ethereum", precision: 18, priceCents: BigInt(430000) },
};

export type EarnPool = {
  id: string;
  assets: readonly [EarnAssetId, EarnAssetId];
  aprBps: number;
  performance30dBps: number;
  holdings: EarnHoldings;
};
export type EarnPosition = { supplied: EarnHoldings; feesEarnedCents: bigint };
export type EarnState = {
  pools: EarnPool[];
  balances: Record<EarnAssetId, bigint>;
  positions: Record<string, EarnPosition>;
  completedActionIds: string[];
};
export type EarnDraft = { poolId: string; asset: EarnAssetId; mode: EarnMode; amount: string };
export type EarnAction = EarnDraft & { id: string };
export type EarnResult = { ok: true; state: EarnState; action: EarnAction; message: string } | { ok: false; message: string };
export type ParsedEarnAmount = { ok: true; units: bigint } | { ok: false; message: string };

function assetScale(asset: EarnAssetId) {
  return BigInt(10) ** BigInt(EARN_ASSETS[asset].precision);
}

export function parseEarnAmount(value: string, asset: EarnAssetId): ParsedEarnAmount {
  const input = value.trim();
  if (!input) return { ok: false, message: "Enter an amount to continue." };
  if (input.startsWith("-")) return { ok: false, message: "Enter an amount greater than zero." };
  if (input.length > 96) return { ok: false, message: "Enter a smaller amount." };
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(input)) {
    return { ok: false, message: "Enter a number using digits and a decimal point." };
  }
  const [whole = "0", fraction = ""] = input.split(".");
  const precision = EARN_ASSETS[asset].precision;
  if (fraction.length > precision) return { ok: false, message: `Use up to ${precision} decimal places for ${asset}.` };
  const units = BigInt(whole || "0") * assetScale(asset) + BigInt(fraction.padEnd(precision, "0") || "0");
  if (units <= ZERO) return { ok: false, message: "Enter an amount greater than zero." };
  return { ok: true, units };
}

// A lossless value for inputs, Max, supplied amounts, and success messages.
export function earnAmountInput(units: bigint, asset: EarnAssetId) {
  const scale = assetScale(asset);
  const whole = units / scale;
  const fraction = (units % scale).toString().padStart(EARN_ASSETS[asset].precision, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function formatEarnAmount(units: bigint, asset: EarnAssetId) {
  const [whole, fraction] = earnAmountInput(units, asset).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

// USD has 20 decimal places internally, preserving every supported token's smallest unit.
export function earnAssetValue(units: bigint, asset: EarnAssetId) {
  return units * EARN_ASSETS[asset].priceCents * USD_SCALE / (assetScale(asset) * HUNDRED);
}

export function formatEarnUsd(value: bigint) {
  const negative = value < ZERO;
  const absolute = negative ? -value : value;
  const roundedCents = (absolute * HUNDRED + USD_SCALE / BigInt(2)) / USD_SCALE;
  const whole = (roundedCents / HUNDRED).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "−" : ""}$${whole}.${(roundedCents % HUNDRED).toString().padStart(2, "0")}`;
}

export function formatEarnApr(bps: number) {
  return `${(bps / 100).toFixed(2)}%`;
}

// Display rounding only; balances and transaction inputs retain every unit.
export function formatEarnWholeUsd(value: bigint) {
  const absolute = value < ZERO ? -value : value;
  const whole = ((absolute + USD_SCALE / BigInt(2)) / USD_SCALE).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < ZERO ? "−" : ""}$${whole}`;
}

export function formatEarnPerformance(bps: number) {
  return `${bps < 0 ? "−" : "+"}${formatEarnApr(Math.abs(bps))}`;
}

export function earnHoldingsValue(holdings: EarnHoldings) {
  return (Object.entries(holdings) as [EarnAssetId, bigint][]).reduce((total, [asset, amount]) => total + earnAssetValue(amount, asset), ZERO);
}

export function earnPoolValue(pool: EarnPool) {
  return earnHoldingsValue(pool.holdings);
}

export function earnPositionValue(state: EarnState, poolId: string) {
  return earnHoldingsValue(state.positions[poolId]?.supplied ?? {});
}

export function earnOverview(state: EarnState) {
  return {
    totalDeposits: state.pools.reduce((sum, pool) => sum + earnPoolValue(pool), ZERO),
    yourDeposits: Object.values(state.positions).reduce((sum, position) => sum + earnHoldingsValue(position.supplied), ZERO),
    feesEarned: Object.values(state.positions).reduce((sum, position) => sum + position.feesEarnedCents * USD_SCALE / HUNDRED, ZERO),
  };
}

export function earnComposition(pool: EarnPool) {
  const total = earnPoolValue(pool);
  const firstValue = earnAssetValue(pool.holdings[pool.assets[0]] ?? ZERO, pool.assets[0]);
  const firstPercent = total === ZERO ? 0 : Number(firstValue * BigInt(100000000) / total) / 1000000;
  return pool.assets.map((asset, index) => ({
    asset,
    amount: pool.holdings[asset] ?? ZERO,
    value: earnAssetValue(pool.holdings[asset] ?? ZERO, asset),
    percent: total === ZERO ? 0 : index === 0 ? firstPercent : 100 - firstPercent,
  }));
}

export function filterEarnPools(state: EarnState, options: {
  tab: "all" | "mine";
  query: string;
  asset: EarnAssetFilter;
  sort: EarnSort;
  direction: "asc" | "desc";
}) {
  const query = options.query.trim().toLowerCase().replace(/[\s/−_-]+/g, "");
  return state.pools.filter((pool) => {
    if (options.tab === "mine" && earnPositionValue(state, pool.id) === ZERO) return false;
    if (options.asset !== "All" && !pool.assets.includes(options.asset)) return false;
    const searchable = [pool.assets.join(""), ...pool.assets, ...pool.assets.map((asset) => EARN_ASSETS[asset].name)];
    return searchable.some((value) => value.toLowerCase().replace(/\s/g, "").includes(query));
  }).sort((a, b) => {
    const aValue = options.sort === "apr" ? BigInt(a.aprBps) : options.sort === "performance" ? BigInt(a.performance30dBps) : options.sort === "position" ? earnPositionValue(state, a.id) : earnPoolValue(a);
    const bValue = options.sort === "apr" ? BigInt(b.aprBps) : options.sort === "performance" ? BigInt(b.performance30dBps) : options.sort === "position" ? earnPositionValue(state, b.id) : earnPoolValue(b);
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return comparison === 0 ? a.id.localeCompare(b.id) : options.direction === "asc" ? comparison : -comparison;
  });
}

export function earnAvailableAmount(state: EarnState, draft: Pick<EarnDraft, "poolId" | "asset" | "mode">) {
  return draft.mode === "deposit" ? state.balances[draft.asset] : state.positions[draft.poolId]?.supplied[draft.asset] ?? ZERO;
}

export function validateEarnDraft(state: EarnState, draft: EarnDraft): ParsedEarnAmount {
  const pool = state.pools.find((candidate) => candidate.id === draft.poolId);
  if (!pool) return { ok: false, message: "Select an available pool." };
  if (!pool.assets.includes(draft.asset)) return { ok: false, message: "Select one of this pool’s two assets." };
  if (draft.mode !== "deposit" && draft.mode !== "withdraw") return { ok: false, message: "Select Deposit or Withdraw." };
  const parsed = parseEarnAmount(draft.amount, draft.asset);
  if (!parsed.ok) return parsed;
  if (parsed.units > earnAvailableAmount(state, draft)) {
    return { ok: false, message: draft.mode === "deposit"
      ? `Not enough ${draft.asset}. Use Max or enter a smaller amount.`
      : `You can only withdraw the ${draft.asset} you supplied. Use Max or enter a smaller amount.` };
  }
  return parsed;
}

export function applyEarnAction(state: EarnState, action: EarnAction): EarnResult {
  if (!action.id || state.completedActionIds.includes(action.id)) return { ok: false, message: "This action has already been processed." };
  const parsed = validateEarnDraft(state, action);
  if (!parsed.ok) return parsed;
  const delta = action.mode === "deposit" ? parsed.units : -parsed.units;
  const position = state.positions[action.poolId] ?? { supplied: {}, feesEarnedCents: ZERO };
  const next: EarnState = {
    pools: state.pools.map((pool) => pool.id === action.poolId ? {
      ...pool, holdings: { ...pool.holdings, [action.asset]: (pool.holdings[action.asset] ?? ZERO) + delta },
    } : pool),
    balances: { ...state.balances, [action.asset]: state.balances[action.asset] - delta },
    positions: { ...state.positions, [action.poolId]: {
      supplied: { ...position.supplied, [action.asset]: (position.supplied[action.asset] ?? ZERO) + delta },
      feesEarnedCents: position.feesEarnedCents,
    } },
    completedActionIds: [...state.completedActionIds, action.id],
  };
  const pool = state.pools.find((candidate) => candidate.id === action.poolId)!;
  return {
    ok: true, state: next, action,
    message: `${action.mode === "deposit" ? "Deposit" : "Withdrawal"} complete. ${formatEarnAmount(parsed.units, action.asset)} ${action.asset} ${action.mode === "deposit" ? "supplied to" : "returned from"} ${pool.assets.join(" / ")}.`,
  };
}

function fixtureUnits(value: string, asset: EarnAssetId) {
  const parsed = parseEarnAmount(value, asset);
  if (!parsed.ok) throw new Error(`Invalid Earn fixture: ${parsed.message}`);
  return parsed.units;
}

export function createInitialEarnState(): EarnState {
  // Independent 30-day position-return fixtures, not derived from funding or fee APR.
  const fixtures: [string, EarnAssetId, EarnAssetId, string, string, number, number][] = [
    ["xlm-usdc", "XLM", "USDC", "6000000", "1500000", 782, 245],
    ["xlm-usdt0", "XLM", "USDT0", "4000000", "1250000", 924, -112],
    ["usdc-usdt0", "USDC", "USDT0", "2400000", "2300000", 364, 81],
    ["btc-usdc", "BTC", "USDC", "15", "1320000", 618, 368],
    ["eth-usdt0", "ETH", "USDT0", "240", "980000", 856, -64],
    ["btc-usdt0", "BTC", "USDT0", "7", "680000", 802, 192],
  ];
  return {
    pools: fixtures.map(([id, a, b, amountA, amountB, aprBps, performance30dBps]) => ({
      id, assets: [a, b], aprBps, performance30dBps,
      holdings: { [a]: fixtureUnits(amountA, a), [b]: fixtureUnits(amountB, b) },
    })),
    balances: {
      XLM: fixtureUnits("10000.1234567", "XLM"), USDC: fixtureUnits("5000", "USDC"),
      USDT0: fixtureUnits("3500.654321", "USDT0"), BTC: fixtureUnits("0.025", "BTC"), ETH: fixtureUnits("1.25", "ETH"),
    },
    positions: {
      "xlm-usdc": { supplied: { XLM: fixtureUnits("2000", "XLM"), USDC: fixtureUnits("1500", "USDC") }, feesEarnedCents: BigInt(1842) },
      "usdc-usdt0": { supplied: { USDC: fixtureUnits("750", "USDC"), USDT0: fixtureUnits("1250", "USDT0") }, feesEarnedCents: BigInt(986) },
      "eth-usdt0": { supplied: { ETH: fixtureUnits("0.125", "ETH"), USDT0: fixtureUnits("300", "USDT0") }, feesEarnedCents: BigInt(734) },
    },
    completedActionIds: [],
  };
}

// The synchronous gate rejects overlapping submissions even before React can re-render.
// A captured draft and a final validation keep the delayed update atomic.
export function createEarnDemoProcessor(initial: EarnState, delay: () => Promise<void> = () => new Promise((resolve) => setTimeout(resolve, DEMO_PROCESSING_MS))) {
  let state = initial;
  let pending = false;
  let sequence = initial.completedActionIds.length;
  return {
    isPending: () => pending,
    async submit(draft: EarnDraft): Promise<EarnResult> {
      if (pending) return { ok: false, message: "An action is processing. Wait for it to finish." };
      const validation = validateEarnDraft(state, draft);
      if (!validation.ok) return validation;
      const action = { ...draft, id: `earn-demo-${++sequence}` };
      pending = true;
      try {
        await delay();
        const result = applyEarnAction(state, action);
        if (result.ok) state = result.state;
        return result;
      } catch {
        return { ok: false, message: "The action could not finish. Your balances are unchanged; try again." };
      } finally {
        pending = false;
      }
    },
  };
}

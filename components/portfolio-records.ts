import type { OptionsMarketState } from "./options-market";
import { CURRENT_USER, getExpiration, marketConfigs } from "./options-market";
import type { PerpetualPosition } from "./perpetuals-market";

export type SpotRecord = {
  id: string;
  at: number;
  paid: number;
  paidAsset: string;
  received: number;
  receivedAsset: string;
  fees: { amount: number; asset: string }[];
  provenance: "preview" | "confirmed";
  transactionHash?: string;
};

export type PaymentRecord = {
  id: string;
  at: number;
  position: PerpetualPosition;
  hidden?: boolean;
};

// Only recorded, verified trade outcomes belong here. Payment and preview
// producers intentionally never create these events. Net already includes fees.
export type RealizedOutcome = {
  id: string;
  product: "options" | "perpetuals";
  at: number;
  currency: "USDC";
  kind: "trade-close" | "settlement";
  provenance: "confirmed";
  pnl: { basis: "net"; amount: number } | { basis: "gross"; amount: number; fees: number };
};

export type PortfolioRecords = {
  version: 1;
  wallet: string;
  network: "testnet";
  spot: SpotRecord[];
  options: OptionsMarketState | null;
  payments: PaymentRecord[];
  outcomes: RealizedOutcome[];
};

export function emptyRecords(wallet: string): PortfolioRecords {
  return { version: 1, wallet, network: "testnet", spot: [], options: null, payments: [], outcomes: [] };
}

export function parsePortfolioRecords(raw: string, wallet: string): PortfolioRecords {
  const value = JSON.parse(raw) as PortfolioRecords;
  const finite = (number: unknown): number is number => typeof number === "number" && Number.isFinite(number);
  const timestamp = (at: unknown) => finite(at) && at >= 0 && at <= 8.64e15;
  const object = (item: unknown): item is Record<string, unknown> => !!item && typeof item === "object";
  const id = (item: unknown) => object(item) && typeof item.id === "string" && item.id.length > 0;
  const option = (item: unknown) => object(item) && id(item)
    && typeof item.pairId === "string" && Object.hasOwn(marketConfigs, item.pairId)
    && ["call", "put"].includes(String(item.optionSide))
    && ["30-oct", "27-nov", "18-dec"].includes(String(item.expirationId))
    && finite(item.strike) && finite(item.quantity) && item.quantity >= 0;
  if (!object(value) || value.version !== 1 || value.wallet !== wallet || value.network !== "testnet"
    || !Array.isArray(value.spot) || !Array.isArray(value.payments) || !Array.isArray(value.outcomes)
    || !value.spot.every((record) => object(record) && id(record) && timestamp(record.at)
      && finite(record.paid) && finite(record.received) && typeof record.paidAsset === "string" && typeof record.receivedAsset === "string"
      && ["preview", "confirmed"].includes(record.provenance) && Array.isArray(record.fees)
      && record.fees.every((fee: { amount: number; asset: string }) => object(fee) && finite(fee.amount) && typeof fee.asset === "string"))
    || !value.payments.every((record) => object(record) && id(record) && timestamp(record.at) && object(record.position)
      && typeof record.position.marketId === "string" && Object.hasOwn(marketConfigs, record.position.marketId)
      && ["long", "short"].includes(record.position.side) && finite(record.position.margin)
      && typeof record.position.transactionHash === "string" && /^[a-f0-9]{64}$/i.test(record.position.transactionHash))
    || !value.outcomes.every((record) => object(record) && id(record) && timestamp(record.at)
      && ["options", "perpetuals"].includes(record.product) && ["trade-close", "settlement"].includes(record.kind)
      && record.currency === "USDC" && record.provenance === "confirmed" && object(record.pnl) && finite(record.pnl.amount)
      && (record.pnl.basis === "net" || (record.pnl.basis === "gross" && finite(record.pnl.fees) && record.pnl.fees >= 0)))) {
    throw new Error("Invalid portfolio history");
  }
  if (value.options !== null) {
    const state = value.options;
    if (!object(state) || !Array.isArray(state.orders) || !Array.isArray(state.positions) || !Array.isArray(state.fills)
      || !Array.isArray(state.notifications) || !finite(state.sequence)
      || !state.orders.every((record) => option(record) && timestamp(record.createdAt) && timestamp(record.expiresAt)
        && finite(record.limitPremium) && finite(record.remainingQuantity) && typeof record.owner === "string"
        && ["buy", "sell"].includes(record.orderSide) && ["open", "filled", "cancelled"].includes(record.status)
        && (record.cancelledAt === undefined || timestamp(record.cancelledAt)))
      || !state.positions.every((record) => option(record) && timestamp(record.openedAt) && finite(record.premium)
        && typeof record.fillId === "string" && ["long", "short"].includes(record.direction)
        && ["open", "closed", "settled"].includes(record.status)
        && (record.closedAt === undefined || timestamp(record.closedAt))
        && (record.exitPremium === undefined || finite(record.exitPremium)))) throw new Error("Invalid options history");
  }
  return value;
}

export function deduplicate<T extends { id: string }>(records: readonly T[]): T[] {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

export function netPnl(outcome: RealizedOutcome) {
  return outcome.pnl.basis === "net" ? outcome.pnl.amount : outcome.pnl.amount - outcome.pnl.fees;
}

export type PnlPeriod = "1W" | "1M" | "3M" | "All";
export type PnlView = "Overall" | "Options" | "Perpetuals";

export function cumulativePnl(outcomes: readonly RealizedOutcome[], view: PnlView, period: PnlPeriod, now: number) {
  const start = period === "All" ? -Infinity : now - ({ "1W": 7, "1M": 30, "3M": 90 }[period] * 86_400_000);
  let total = 0;
  return deduplicate(outcomes)
    .filter((event) => event.provenance === "confirmed" && event.currency === "USDC"
      && (event.kind === "trade-close" || event.kind === "settlement")
      && (event.product === "options" || event.product === "perpetuals")
      && (view === "Overall" || event.product === view.toLowerCase())
      && event.at >= start && event.at <= now && Number.isFinite(netPnl(event)))
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
    .map((event) => ({ id: event.id, at: event.at, value: total += netPnl(event) }));
}

export type OptionHistoryRow = {
  id: string; at: number; option: string; expiration: number; side: "Buy" | "Sell";
  size: number; premium: number; status: string;
};

// The existing matching engine is a preview. Preserve its actual fills and
// closing records, but never turn theoretical marks or previews into real P&L.
export function optionHistory(state: OptionsMarketState | null, now: number): OptionHistoryRow[] {
  if (!state) return [];
  const rows: OptionHistoryRow[] = [];
  const identity = (record: OptionsMarketState["positions"][number] | OptionsMarketState["orders"][number]) => ({
    option: `${marketConfigs[record.pairId].base} ${record.strike} ${record.optionSide === "call" ? "Call" : "Put"}`,
    expiration: getExpiration(record.expirationId).timestamp,
  });
  const openings = new Map<string, OptionsMarketState["positions"][number]>();
  for (const position of deduplicate(state.positions)) {
    const existing = openings.get(position.fillId);
    openings.set(position.fillId, existing ? { ...existing, quantity: existing.quantity + position.quantity } : { ...position });
    if (position.status !== "open" && position.closedAt !== undefined && position.exitPremium !== undefined) {
      rows.push({ id: `close:${position.id}`, at: position.closedAt, ...identity(position),
        side: position.direction === "long" ? "Sell" : "Buy", size: position.quantity,
        premium: position.exitPremium, status: position.status === "settled" ? "Settled · preview" : "Closed · preview" });
    }
  }
  for (const position of openings.values()) {
    rows.push({ id: `fill:${position.fillId}`, at: position.openedAt, ...identity(position),
      side: position.direction === "long" ? "Buy" : "Sell", size: position.quantity,
      premium: position.premium, status: "Filled · preview" });
  }
  for (const order of deduplicate(state.orders)) {
    if (order.owner !== CURRENT_USER || order.remainingQuantity <= 0) continue;
    const expired = order.status === "open" && order.expiresAt <= now;
    rows.push({ id: `order:${order.id}`, at: order.cancelledAt ?? (expired ? order.expiresAt : order.createdAt), ...identity(order),
      side: order.orderSide === "buy" ? "Buy" : "Sell", size: order.remainingQuantity, premium: order.limitPremium,
      status: order.status === "cancelled" ? "Cancelled" : expired ? "Expired" : "Waiting" });
  }
  return rows.sort((a, b) => b.at - a.at || a.id.localeCompare(b.id));
}

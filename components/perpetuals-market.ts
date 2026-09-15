import type { AssetPairId } from "./asset-pair-selector";

export type PerpetualSide = "long" | "short";
export type PerpetualOrderType = "market" | "limit";
export type PerpetualMarket = {
  id: AssetPairId;
  base: "XLM" | "BTC" | "ETH";
  quote: "USDC";
  name: string;
  currentPrice: number;
  minimumMargin: number;
  minimumLeverage: number;
  maximumLeverage: number;
  leverageStep: number;
  maintenanceMarginRate: number;
  feeRate: number;
};

export type PerpetualPosition = {
  id: string;
  marketId: AssetPairId;
  side: PerpetualSide;
  size: number;
  margin: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  takeProfit?: number;
  stopLoss?: number;
  transactionHash?: string;
  isTestnetDemo?: boolean;
  status: "open" | "closing";
};

export type PerpetualOrder = {
  id: string;
  marketId: AssetPairId;
  side: PerpetualSide;
  orderType: "limit";
  size: number;
  margin: number;
  leverage: number;
  limitPrice: number;
  takeProfit?: number;
  stopLoss?: number;
  createdAt: number;
  status: "waiting" | "cancelling";
};

export const PERPETUAL_COLLATERAL = "USDC";
export const PERPETUAL_WALLET_BALANCE = 3_122;

export const perpetualMarkets: Record<AssetPairId, PerpetualMarket> = {
  "XLM-USDC": {
    id: "XLM-USDC",
    base: "XLM",
    quote: "USDC",
    name: "Stellar Lumens",
    currentPrice: 0.2502,
    minimumMargin: 10,
    minimumLeverage: 1,
    maximumLeverage: 25,
    leverageStep: 1,
    maintenanceMarginRate: 0.04,
    feeRate: 0.0006,
  },
  "BTC-USDC": {
    id: "BTC-USDC",
    base: "BTC",
    quote: "USDC",
    name: "Bitcoin",
    currentPrice: 112_480.35,
    minimumMargin: 25,
    minimumLeverage: 1,
    maximumLeverage: 20,
    leverageStep: 1,
    maintenanceMarginRate: 0.05,
    feeRate: 0.0006,
  },
  "ETH-USDC": {
    id: "ETH-USDC",
    base: "ETH",
    quote: "USDC",
    name: "Ethereum",
    currentPrice: 4_325.8,
    minimumMargin: 20,
    minimumLeverage: 1,
    maximumLeverage: 20,
    leverageStep: 1,
    maintenanceMarginRate: 0.05,
    feeRate: 0.0006,
  },
};

export function executablePrice(market: PerpetualMarket, side: PerpetualSide) {
  const spread = side === "long" ? 1.0004 : 0.9996;
  return market.currentPrice * spread;
}

export type PerpetualSizeUnit = "quote" | "base";
const amountScale = BigInt(10_000_000);

export function parsePerpetualAmount(value: string): bigint | undefined {
  if (!/^(?:\d+\.?\d{0,7}|\.\d{1,7})$/.test(value)) return undefined;
  const [whole = "0", fraction = ""] = value.split(".");
  return BigInt(whole || "0") * amountScale + BigInt(fraction.padEnd(7, "0"));
}

export function formatPerpetualInput(units: bigint) {
  const fraction = (units % amountScale).toString().padStart(7, "0").replace(/0+$/, "");
  return `${units / amountScale}${fraction ? `.${fraction}` : ""}`;
}

function priceRatio(price: number) {
  if (!Number.isFinite(price) || price <= 0) return undefined;
  const [coefficient, exponent = "0"] = price.toString().split("e");
  const [whole, fraction = ""] = coefficient.split(".");
  const decimals = fraction.length - Number(exponent);
  return {
    numerator: BigInt(whole + fraction) * (decimals < 0 ? BigInt(10) ** BigInt(-decimals) : BigInt(1)),
    denominator: decimals > 0 ? BigInt(10) ** BigInt(decimals) : BigInt(1),
  };
}

function roundedDivide(numerator: bigint, denominator: bigint) {
  return (numerator + denominator / BigInt(2)) / denominator;
}

export function perpetualSizeInput(margin: string, leverage: number, unit: PerpetualSizeUnit, price: number) {
  const units = parsePerpetualAmount(margin);
  if (units === undefined || !Number.isInteger(leverage) || leverage <= 0) return "";
  const notional = units * BigInt(leverage);
  if (unit === "quote") return formatPerpetualInput(notional);
  const ratio = priceRatio(price);
  return ratio ? formatPerpetualInput(roundedDivide(notional * ratio.denominator, ratio.numerator)) : "";
}

export function perpetualMarginInput(size: string, leverage: number, unit: PerpetualSizeUnit, price: number) {
  const units = parsePerpetualAmount(size);
  if (units === undefined || !Number.isInteger(leverage) || leverage <= 0) return undefined;
  if (unit === "quote") return formatPerpetualInput(roundedDivide(units, BigInt(leverage)));
  const ratio = priceRatio(price);
  return ratio ? formatPerpetualInput(roundedDivide(units * ratio.numerator, ratio.denominator * BigInt(leverage))) : undefined;
}

export function perpetualLeverageLevels(market: PerpetualMarket) {
  return [...new Set([market.minimumLeverage, 5, 10, 15, 20, market.maximumLeverage])]
    .filter(level => level >= market.minimumLeverage && level <= market.maximumLeverage
      && (level - market.minimumLeverage) % market.leverageStep === 0)
    .sort((a, b) => a - b);
}

export function liquidationPrice(
  market: PerpetualMarket,
  side: PerpetualSide,
  entryPrice: number,
  leverage: number,
) {
  if (!Number.isFinite(entryPrice) || entryPrice <= 0 || !Number.isFinite(leverage) || leverage <= 0) return undefined;
  const move = (1 / leverage) - market.maintenanceMarginRate;
  return Math.max(0, side === "long" ? entryPrice * (1 - move) : entryPrice * (1 + move));
}

export function positionPerformance(position: PerpetualPosition, market: PerpetualMarket) {
  const quantity = position.entryPrice > 0 ? position.size / position.entryPrice : 0;
  const grossPnl = position.side === "long"
    ? (position.markPrice - position.entryPrice) * quantity
    : (position.entryPrice - position.markPrice) * quantity;
  const costs = position.size * market.feeRate;
  const pnl = grossPnl - costs;
  const roi = position.margin > 0 ? (pnl / position.margin) * 100 : 0;
  return { pnl, roi };
}

export const initialPerpetualPositions: PerpetualPosition[] = [
  {
    id: "perp-position-btc-long",
    marketId: "BTC-USDC",
    side: "long",
    size: 2_500,
    margin: 500,
    leverage: 5,
    entryPrice: 111_950,
    markPrice: 112_480.35,
    liquidationPrice: 95_157.5,
    takeProfit: 118_000,
    stopLoss: 108_000,
    status: "open",
  },
  {
    id: "perp-position-eth-short",
    marketId: "ETH-USDC",
    side: "short",
    size: 4_200,
    margin: 600,
    leverage: 7,
    entryPrice: 4_380,
    markPrice: 4_325.8,
    liquidationPrice: 4_786.71,
    takeProfit: 4_050,
    stopLoss: 4_520,
    status: "open",
  },
];

export const initialPerpetualOrders: PerpetualOrder[] = [
  {
    id: "perp-order-xlm-long",
    marketId: "XLM-USDC",
    side: "long",
    orderType: "limit",
    size: 500,
    margin: 100,
    leverage: 5,
    limitPrice: 0.242,
    createdAt: Date.UTC(2026, 8, 14, 8, 20),
    status: "waiting",
  },
  {
    id: "perp-order-eth-short",
    marketId: "ETH-USDC",
    side: "short",
    orderType: "limit",
    size: 1_500,
    margin: 300,
    leverage: 5,
    limitPrice: 4_410,
    stopLoss: 4_560,
    createdAt: Date.UTC(2026, 8, 14, 10, 5),
    status: "waiting",
  },
];

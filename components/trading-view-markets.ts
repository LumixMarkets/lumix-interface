export type TradingViewMarket = {
  exchange: string;
  pair: string;
  symbol: string;
};

// Keep external chart references independent from Lumix's Stellar testnet
// payment and collateral configuration. Every entry is an actual USDC market
// listed by TradingView for the named exchange.
export const TRADING_VIEW_MARKETS = {
  BTC: {
    exchange: "Coinbase",
    pair: "BTC / USDC",
    symbol: "COINBASE:BTCUSDC",
  },
  ETH: {
    exchange: "Coinbase",
    pair: "ETH / USDC",
    symbol: "COINBASE:ETHUSDC",
  },
  XLM: {
    exchange: "KuCoin",
    pair: "XLM / USDC",
    symbol: "KUCOIN:XLMUSDC",
  },
} as const satisfies Record<string, TradingViewMarket>;

export function getTradingViewMarket(asset: string) {
  return (TRADING_VIEW_MARKETS as Record<string, TradingViewMarket | undefined>)[asset];
}

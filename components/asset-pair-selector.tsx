"use client";

import { AssetDropdown } from "./asset-dropdown";

export type AssetPairId = "XLM-USDC" | "BTC-USDC" | "ETH-USDC";

export type AssetPairOption = {
  id: AssetPairId;
  base: "XLM" | "BTC" | "ETH";
  quote: "USDC";
  name: string;
  mark: string;
};

export const assetPairOptions: readonly AssetPairOption[] = [
  { id: "XLM-USDC", base: "XLM", quote: "USDC", name: "Stellar Lumens", mark: "X" },
  { id: "BTC-USDC", base: "BTC", quote: "USDC", name: "Bitcoin", mark: "B" },
  { id: "ETH-USDC", base: "ETH", quote: "USDC", name: "Ethereum", mark: "E" },
] as const;

export function AssetPairSelector({ label, value, onChange, variant = "default" }: {
  label: string;
  value: AssetPairId;
  onChange: (value: AssetPairId) => void;
  variant?: "default" | "segmented";
}) {
  const selectedPair = assetPairOptions.find((pair) => pair.id === value) ?? assetPairOptions[0];
  return <AssetDropdown label={label} value={value} onChange={onChange}
    className={`options-pair-trigger${variant === "segmented" ? " options-pair-trigger--segmented" : ""}`}
    menuClassName={`options-pair-menu${variant === "segmented" ? " options-pair-menu--segmented" : ""}`}
    selectedContent={<span>{selectedPair.base} / {selectedPair.quote}</span>}
    options={assetPairOptions.map((pair) => ({
      value: pair.id,
      label: `${pair.base} / ${pair.quote}`,
      content: <><span className="asset-symbol" data-asset={pair.base}>{pair.mark}</span>
        <span className="asset-select-option-copy"><strong>{pair.base} / {pair.quote}</strong><span>{pair.name}</span></span></>,
    }))} />;
}

import Image from "next/image";
import type { EarnAssetId } from "./earn-model";

const tokenLogos: Record<EarnAssetId, string> = {
  XLM: "/tokens/xlm.svg",
  USDC: "/tokens/usdc.svg",
  USDT0: "/tokens/usdt0.svg",
  BTC: "/tokens/btc.png",
  ETH: "/tokens/eth.svg",
};

export function EarnTokenIcon({ asset }: { asset: EarnAssetId }) {
  return (
    <span className="earn-token-icon" data-asset={asset} aria-hidden="true">
      <Image src={tokenLogos[asset]} width={32} height={32} alt="" unoptimized />
    </span>
  );
}

export function EarnPairIcons({ assets }: { assets: readonly [EarnAssetId, EarnAssetId] }) {
  return <span className="earn-pair-icons"><EarnTokenIcon asset={assets[0]} /><EarnTokenIcon asset={assets[1]} /></span>;
}

import { LUMIX_PUBLIC_CONFIG } from "./runtime-config";

export const LUMIX_STELLAR_NETWORK = {
  id: LUMIX_PUBLIC_CONFIG.stellar.id,
  label: LUMIX_PUBLIC_CONFIG.stellar.label,
  passphrase: LUMIX_PUBLIC_CONFIG.stellar.passphrase,
  horizonUrl: LUMIX_PUBLIC_CONFIG.stellar.horizonUrl,
  sorobanRpcUrl: LUMIX_PUBLIC_CONFIG.stellar.sorobanRpcUrl,
  explorer: "stellarexpert",
  explorerBaseUrl: LUMIX_PUBLIC_CONFIG.stellar.explorerBaseUrl,
  assets: {
    USDC: {
      code: "USDC",
      issuer: LUMIX_PUBLIC_CONFIG.stellar.usdcIssuer,
      sacAddress: LUMIX_PUBLIC_CONFIG.stellar.usdcSacAddress,
    },
  },
  applicationContracts: {
    options: LUMIX_PUBLIC_CONFIG.stellar.optionsContractAddress,
    perpetuals: LUMIX_PUBLIC_CONFIG.stellar.perpetualsContractAddress,
  },
  destinations: {
    perpetualsDemo: LUMIX_PUBLIC_CONFIG.stellar.perpetualsPaymentDestination,
  },
} as const;

export function walletAssetKey(assetCode: string, assetIssuer?: string) {
  const normalizedCode = assetCode.toUpperCase();
  return assetIssuer
    ? `${normalizedCode}:${assetIssuer.toUpperCase()}`
    : normalizedCode;
}

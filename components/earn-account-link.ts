import { StrKey } from "@stellar/stellar-sdk/base";
import { LUMIX_STELLAR_NETWORK } from "./stellar-network";

// Local checksum validation only. No account lookups or ledger requests.
export function earnAccountUrl(account: string | null | undefined) {
  if (!account || !StrKey.isValidEd25519PublicKey(account)) return undefined;
  return `${LUMIX_STELLAR_NETWORK.explorerBaseUrl}/account/${encodeURIComponent(account)}`;
}

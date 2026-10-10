import { deduplicate, emptyRecords, parsePortfolioRecords, type PaymentRecord, type PortfolioRecords } from "./portfolio-records";

export const portfolioStorageKey = (wallet: string) => `lumix:portfolio:v1:testnet:${wallet}`;
const receiptKey = (wallet: string) => `${portfolioStorageKey(wallet)}:pending-payments`;
const pendingPayments = new Map<string, PaymentRecord[]>();

function readJournal(wallet: string): PaymentRecord[] {
  const raw = localStorage.getItem(receiptKey(wallet));
  return raw ? parsePortfolioRecords(raw, wallet).payments : [];
}

// Write-ahead receipts do not depend on the main history being readable. Keep
// an in-session copy as well, including when the browser refuses all writes.
export function queueConfirmedPayment(wallet: string, payment: PaymentRecord) {
  const pending = deduplicate([...(pendingPayments.get(wallet) ?? []), payment]);
  pendingPayments.set(wallet, pending);
  try {
    const journal = { ...emptyRecords(wallet), payments: deduplicate([...readJournal(wallet), ...pending]) };
    const raw = JSON.stringify(journal);
    parsePortfolioRecords(raw, wallet);
    localStorage.setItem(receiptKey(wallet), raw);
  } catch {
    // Reading/recovering the main archive reports the storage failure to UI.
    // Never retry sending the payment to recover a missing receipt.
  }
}

export function readPortfolioRecords(wallet: string): PortfolioRecords {
  const raw = localStorage.getItem(portfolioStorageKey(wallet));
  const data = raw ? parsePortfolioRecords(raw, wallet) : emptyRecords(wallet);
  const pending = deduplicate([...readJournal(wallet), ...(pendingPayments.get(wallet) ?? [])]);
  if (pending.length) {
    // A repeated confirmation must not reset an existing receipt's date or
    // restore a payment the user has already removed from the positions view.
    data.payments = deduplicate([...pending, ...data.payments]);
    const serialized = JSON.stringify(data);
    parsePortfolioRecords(serialized, wallet);
    localStorage.setItem(portfolioStorageKey(wallet), serialized);
    localStorage.removeItem(receiptKey(wallet));
    pendingPayments.delete(wallet);
  }
  return data;
}

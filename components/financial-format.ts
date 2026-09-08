const financialFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

function normalizeRoundedZero(value: number) {
  return Math.abs(value) < 0.005 ? 0 : value;
}

export function formatFinancial(value: number) {
  if (!Number.isFinite(value)) return "—";
  return financialFormatter.format(normalizeRoundedZero(value));
}

export function formatFinancialWithAsset(value: number, asset: string) {
  return `${formatFinancial(value)} ${asset}`;
}

export function formatSignedFinancial(value: number) {
  if (!Number.isFinite(value)) return "—";
  const normalized = normalizeRoundedZero(value);
  if (normalized === 0) return formatFinancial(0);
  return `${normalized > 0 ? "+" : "−"}${formatFinancial(Math.abs(normalized))}`;
}

export function formatInteger(value: number) {
  if (!Number.isFinite(value)) return "—";
  return integerFormatter.format(value);
}

export function nextDecimalInputValue(
  currentValue: string,
  key: string,
  replaceAll: boolean,
  maximumFractionDigits = 7,
) {
  const current = currentValue.replaceAll(",", "");

  if (/^\d$/.test(key)) {
    const base = replaceAll ? "" : current;
    const fraction = base.split(".")[1];
    if (fraction !== undefined && fraction.length >= maximumFractionDigits) return current;
    return `${base}${key}`;
  }

  if (key === ".") {
    const base = replaceAll ? "" : current;
    if (base.includes(".")) return current;
    return `${base || "0"}.`;
  }

  if (key === "Backspace") return replaceAll ? "" : current.slice(0, -1);
  if (key === "Delete") return "";
  return undefined;
}

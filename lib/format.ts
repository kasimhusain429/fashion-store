import type { Currency } from "./store";

const formatters: Record<Currency, Intl.NumberFormat> = {
  EUR: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
};

export function formatPrice(amount: number, currency: Currency) {
  return formatters[currency].format(amount);
}

export function lookNumber(n: number) {
  return `Look ${String(n).padStart(2, "0")}`;
}

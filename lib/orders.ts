import { PRODUCTS } from "./catalog";

export interface OrderLineInput {
  slug: string;
  colorway: string;
  size: string;
  qty: number;
}

export interface OrderInput {
  email: string;
  name: string;
  phone?: string;
  address: { line1: string; line2?: string; city: string; postcode: string; country: string };
  currency: "EUR" | "USD";
  lines: OrderLineInput[];
}

export const COUNTRIES = [
  "Australia",
  "Austria",
  "Belgium",
  "Canada",
  "Denmark",
  "France",
  "Germany",
  "Hong Kong",
  "Ireland",
  "Italy",
  "Japan",
  "Netherlands",
  "Norway",
  "Portugal",
  "Singapore",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export type FieldErrors = Partial<Record<"email" | "name" | "line1" | "city" | "postcode" | "country" | "lines", string>>;

/** Validates untrusted order input. Prices are never taken from the client. */
export function validateOrder(raw: unknown): { ok: true; order: OrderInput } | { ok: false; errors: FieldErrors } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const a = (r.address ?? {}) as Record<string, unknown>;
  const order: OrderInput = {
    email: str(r.email, 200),
    name: str(r.name),
    phone: str(r.phone, 40) || undefined,
    address: {
      line1: str(a.line1),
      line2: str(a.line2) || undefined,
      city: str(a.city),
      postcode: str(a.postcode, 20),
      country: str(a.country, 60),
    },
    currency: r.currency === "USD" ? "USD" : "EUR",
    lines: Array.isArray(r.lines) ? (r.lines as unknown[]).slice(0, 30).map((l) => l as OrderLineInput) : [],
  };
  const errors: FieldErrors = {};
  if (!EMAIL_RE.test(order.email)) errors.email = "Enter an email address like name@example.com.";
  if (order.name.length < 2) errors.name = "Enter the name for delivery.";
  if (order.address.line1.length < 3) errors.line1 = "Enter the street address.";
  if (order.address.city.length < 2) errors.city = "Enter the town or city.";
  if (order.address.postcode.length < 2) errors.postcode = "Enter the postcode.";
  if (!COUNTRIES.includes(order.address.country)) errors.country = "Choose a delivery country.";
  const validLines = order.lines.every((l) => {
    const p = PRODUCTS.find((x) => x.slug === l?.slug);
    return (
      p &&
      p.colorways.some((c) => c.id === l.colorway) &&
      p.sizes.includes(l.size) &&
      Number.isInteger(l.qty) &&
      l.qty >= 1 &&
      l.qty <= 5
    );
  });
  if (!order.lines.length || !validLines) errors.lines = "Your bag has changed. Review it and try again.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, order };
}

export function priceOrder(order: OrderInput) {
  const lines = order.lines.map((l) => {
    const p = PRODUCTS.find((x) => x.slug === l.slug)!;
    const unit = order.currency === "EUR" ? p.priceEUR : p.priceUSD;
    return { ...l, name: p.name, unit, total: unit * l.qty };
  });
  return { lines, subtotal: lines.reduce((s, l) => s + l.total, 0), delivery: 0 };
}

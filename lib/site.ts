/**
 * House information reused verbatim from the previous VAELIS site (salons, contact,
 * delivery and returns). Do not add policies here that the business has not confirmed.
 */

export const SALONS = [
  {
    city: "Paris",
    name: "Paris salon",
    lines: ["14 Rue Saint-Florentin", "Paris"],
  },
  {
    city: "Kyoto",
    name: "Kyoto atelier",
    lines: ["247 Gionmachi Kitagawa", "Gion Higashiyama, Kyoto"],
  },
] as const;

export const HOURS = "Monday to Saturday, by private appointment";
export const EMAIL = "salon@vaelis-atelier.com";

export const POLICIES = {
  delivery: "Complimentary white-glove courier and carbon-neutral dispatch worldwide.",
  dispatch: "Estimated dispatch: 14 business days.",
  returns: "Returns within 14 days of delivery.",
  exchange: "14-day exchange on every piece.",
  care: "Lifetime care: restoration and tailoring at the Paris and Kyoto salons.",
} as const;

export const MANIFESTO =
  "We do not construct garments to follow the body. We sculpt monumental architectures that suspend time.";

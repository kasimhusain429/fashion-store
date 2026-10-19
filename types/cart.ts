export interface CartItem {
  id: string;
  name: string;
  look: string;
  priceEUR: number;
  priceUSD: number;
  size: string;
  colorway: string;
  image: string;
  quantity: number;
}

export type Currency = "EUR" | "USD";

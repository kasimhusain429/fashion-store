import type { Metadata } from "next";
import { SavedList } from "@/components/shop/SavedList";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default function WishlistPage() {
  return <SavedList />;
}

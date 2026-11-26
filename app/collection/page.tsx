import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopIndex } from "@/components/shop/ShopIndex";

export const metadata: Metadata = {
  title: "Collection",
  description: "The Chrono-Fold collection: six VAELIS t-shirts, filterable by cut and colour.",
};

export default function CollectionPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <ShopIndex />
    </Suspense>
  );
}

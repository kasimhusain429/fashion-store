"use client";

import Link from "next/link";
import { getProduct } from "@/lib/catalog";
import { useShop } from "@/lib/store";
import { ProductPlate } from "./ProductPlate";

export function SavedList() {
  const s = useShop();
  const saved = s.wishlist.map((slug) => getProduct(slug)).filter((p) => !!p);

  return (
    <div className="px-[var(--gutter)] pb-32 pt-[calc(var(--header-h)+8vh)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="t-display text-[clamp(52px,9vw,150px)]">Saved</h1>
        {saved.length > 0 && (
          <p className="t-ui text-muted">
            {saved.length} {saved.length === 1 ? "piece" : "pieces"}, kept on this device
          </p>
        )}
      </div>
      <h2 className="sr-only">Saved pieces</h2>
      {s.hydrated && saved.length === 0 ? (
        <div className="mt-16 flex flex-col items-start gap-6">
          <p className="t-lede measure">Nothing saved yet. Use Save on any piece to keep it here while you decide.</p>
          <Link href="/collection" className="btn btn-solid">
            Browse the collection
          </Link>
        </div>
      ) : (
        <ul className="mt-16 grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3" aria-label="Saved pieces">
          {saved.map((p) => (
            <li key={p.slug}>
              <ProductPlate product={p} colorway={p.colorways[0]} aspect="3/4" sizes="(min-width: 1024px) 30vw, 100vw" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

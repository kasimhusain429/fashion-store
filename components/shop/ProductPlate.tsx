"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition, useState } from "react";
import { imageUrl, type Colorway, type Product } from "@/lib/catalog";
import { formatPrice, lookNumber } from "@/lib/format";
import { shop, useShop } from "@/lib/store";

export function ProductPlate({
  product,
  colorway,
  aspect = "4/5",
  sizes = "(min-width: 1024px) 40vw, 100vw",
  priority = false,
}: {
  product: Product;
  colorway: Colorway;
  aspect?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const s = useShop();
  const [override, setOverride] = useState<{ baseId: string; id: string } | null>(null);
  const selectedId = override?.baseId === colorway.id ? override.id : colorway.id;
  const activeColor = product.colorways.find((c) => c.id === selectedId) ?? colorway;
  const saved = s.wishlist.includes(product.slug);
  const href = `/collection/${product.slug}?c=${activeColor.id}`;
  const price = s.currency === "EUR" ? product.priceEUR : product.priceUSD;

  return (
    <article className="group relative">
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="block"
        aria-label={`${lookNumber(product.look)}, ${product.name} in ${activeColor.name}`}
      >
        <div className="plate relative overflow-hidden" style={{ aspectRatio: aspect }}>
          <ViewTransition name={`tee-${product.slug}`} share="morph" default="none">
            <Image
              src={imageUrl(product, activeColor.id, "front")}
              alt={`${product.name} in ${activeColor.name}, front`}
              fill
              sizes={sizes}
              preload={priority}
              className="render object-contain p-[5%] transition-opacity duration-500 group-hover:opacity-0"
            />
          </ViewTransition>
          <Image
            src={imageUrl(product, activeColor.id, "back")}
            alt=""
            fill
            sizes={sizes}
            className="render object-contain p-[5%] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          <span className="t-label absolute left-4 top-4 text-muted">{lookNumber(product.look)}</span>
        </div>
      </Link>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="t-ui font-medium">
            <Link href={href} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          <p className="t-label mt-1 text-muted">
            {product.cut} · {activeColor.name}
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-0.5" aria-label="Colours">
            {product.colorways.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  title={c.name}
                  aria-label={`View ${product.name} in ${c.name}`}
                  aria-pressed={c.id === activeColor.id}
                  onClick={() => setOverride({ baseId: colorway.id, id: c.id })}
                  className="group/dot relative grid h-7 w-7 cursor-pointer place-items-center"
                >
                  <span
                    className={`block h-4 w-4 rounded-full transition-transform group-hover/dot:scale-115 ${
                      c.id === activeColor.id
                        ? "ring-1 ring-ink ring-offset-2 ring-offset-plaster"
                        : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]"
                    }`}
                    style={{ background: c.swatch }}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="t-ui">{formatPrice(price, s.currency)}</p>
          <button
            type="button"
            onClick={() => shop.toggleWish(product.slug)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
            className="t-label link -mr-1 inline-flex min-h-[28px] items-center px-1 text-muted hover:text-ink"
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </article>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PRODUCTS, imageUrl } from "@/lib/catalog";
import { lookNumber } from "@/lib/format";

/**
 * The lookbook as a pleated strip: each look is a fold of the same cloth.
 * Hover or focus opens one pleat while the others compress.
 */
export function PleatTeaser() {
  const [open, setOpen] = useState(0);

  return (
    <section aria-labelledby="pleat-title" className="px-[var(--gutter)] py-24 lg:py-32">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="pleat-title" className="t-headline text-[clamp(34px,4.4vw,64px)]">
          Six looks, one rail
        </h2>
        <Link href="/lookbook" className="btn btn-line self-start sm:self-auto">
          Open the lookbook
        </Link>
      </div>

      <ul className="mt-12 flex h-[72svh] min-h-[460px] gap-1.5 max-md:h-auto max-md:flex-col">
        {PRODUCTS.map((p, i) => {
          const isOpen = open === i;
          // Each pleat displays its silhouette's signature distinct colorway for maximum visual contrast
          const cw = p.colorways[0];
          return (
            <li
              key={p.slug}
              className="plate relative overflow-hidden transition-[flex-grow] duration-700 max-md:!flex-none max-md:h-[56svh]"
              style={{ flexGrow: isOpen ? 5 : 1, flexBasis: 0, transitionTimingFunction: "var(--ease-cloth)" }}
              onMouseEnter={() => setOpen(i)}
            >
              <Link
                href={`/collection/${p.slug}?c=${cw.id}`}
                onFocus={() => setOpen(i)}
                className="group relative block h-full w-full"
                aria-label={`${lookNumber(p.look)}: ${p.name} in ${cw.name}`}
              >
                <Image
                  src={imageUrl(p, cw.id)}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  // from md up, a closed pleat shows a slice of the cloth; opening it reveals the whole piece
                  className={`render origin-[50%_42%] object-contain p-[4%] transition-transform duration-700 ${isOpen ? "scale-100" : "md:scale-[2.6]"}`}
                  style={{ transitionTimingFunction: "var(--ease-cloth)" }}
                />
                {/* pleat shading: a fold reads as a soft valley at each edge */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                  style={{
                    opacity: isOpen ? 0 : 1,
                    background:
                      "linear-gradient(90deg, rgb(0 0 0 / 0.16), transparent 22%, transparent 70%, rgb(255 255 255 / 0.18) 88%, rgb(0 0 0 / 0.1))",
                  }}
                />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <span className="t-num text-[15px]">{String(p.look).padStart(2, "0")}</span>
                  <span
                    className="t-ui whitespace-nowrap transition-opacity duration-500"
                    style={{ opacity: isOpen ? 1 : 0 }}
                  >
                    {p.name}, {cw.name}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

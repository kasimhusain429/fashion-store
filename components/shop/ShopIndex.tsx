"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { CATEGORIES, COLORWAYS, PRODUCTS, colorwayOf, imageUrl, type CategoryId, type Product } from "@/lib/catalog";
import { formatPrice, lookNumber } from "@/lib/format";
import { useShop } from "@/lib/store";
import { ProductPlate } from "./ProductPlate";

type Sort = "look" | "price-asc" | "price-desc";
const SORTS: { id: Sort; label: string }[] = [
  { id: "look", label: "Look order" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
];

/* Editorial rhythm: plates alternate scale and offset instead of a uniform grid. */
const RHYTHM = [
  { col: "lg:col-span-7", aspect: "4/5", pad: "" },
  { col: "lg:col-span-4 lg:col-start-9", aspect: "3/4", pad: "lg:mt-[22vh]" },
  { col: "lg:col-span-4", aspect: "3/4", pad: "" },
  { col: "lg:col-span-4", aspect: "3/4", pad: "lg:mt-[12vh]" },
  { col: "lg:col-span-4", aspect: "3/4", pad: "" },
  { col: "lg:col-span-6 lg:col-start-4", aspect: "4/5", pad: "" },
];

function matches(p: Product, q: string) {
  if (!q) return true;
  const hay = [p.name, p.cut, CATEGORIES.find((c) => c.id === p.category)?.label, ...p.colorways.map((c) => c.name), ...p.construction]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export function ShopIndex() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const s = useShop();

  const cat = (params.get("cat") as CategoryId | null) ?? null;
  const colour = params.get("colour");
  const sort = (params.get("sort") as Sort | null) ?? "look";
  const q = params.get("q") ?? "";
  const view = params.get("view") === "lineup" ? "lineup" : "plates";

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const results = useMemo(() => {
    const list = PRODUCTS.filter(
      (p) => (!cat || p.category === cat) && (!colour || p.colorways.some((c) => c.id === colour)) && matches(p, q),
    );
    const price = (p: Product) => (s.currency === "EUR" ? p.priceEUR : p.priceUSD);
    if (sort === "price-asc") list.sort((a, b) => price(a) - price(b));
    if (sort === "price-desc") list.sort((a, b) => price(b) - price(a));
    return list;
  }, [cat, colour, q, sort, s.currency]);

  const filtered = !!(cat || colour || q);
  const chip = (active: boolean) =>
    `t-label shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5 transition-colors ${active ? "bg-ink text-washi" : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.22)] hover:shadow-[inset_0_0_0_1px_#000]"}`;

  return (
    <div className="px-[var(--gutter)] pb-28 pt-[calc(var(--header-h)+8vh)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="t-display text-[clamp(52px,9vw,150px)]">Collection</h1>
        <p className="t-ui text-muted" aria-live="polite">
          {filtered ? `${results.length} of ${PRODUCTS.length} pieces` : `${PRODUCTS.length} pieces`}
        </p>
      </div>

      <div
        className="sticky top-[var(--header-offset,0px)] z-20 -mx-[var(--gutter)] mt-10 border-y border-line bg-plaster/92 px-[var(--gutter)] py-3 backdrop-blur-md transition-[top] duration-200"
        style={{ transitionTimingFunction: "var(--ease-cloth)" }}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" role="group" aria-label="Category">
              <button type="button" className={chip(!cat)} aria-pressed={!cat} onClick={() => update({ cat: null })}>
                All
              </button>
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" className={chip(cat === c.id)} aria-pressed={cat === c.id} onClick={() => update({ cat: cat === c.id ? null : c.id })}>
                  {c.label}
                </button>
              ))}
            </div>
            <span className="hidden h-6 w-px shrink-0 bg-line sm:inline-block" aria-hidden="true" />
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Colour">
              {Object.values(COLORWAYS).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={colour === c.id}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => update({ colour: colour === c.id ? null : c.id })}
                  className={`h-8 w-8 shrink-0 rounded-full transition-transform hover:scale-110 ${colour === c.id ? "ring-2 ring-ink ring-offset-2 ring-offset-plaster" : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]"}`}
                  style={{ background: c.swatch }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <label className="relative min-w-[180px] flex-1 xl:w-60 xl:flex-none">
              <span className="sr-only">Search the collection</span>
              <input
                type="search"
                defaultValue={q}
                placeholder="Search the collection"
                onChange={(e) => update({ q: e.target.value.trim() || null })}
                className="field !min-h-[42px] !py-1.5"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="t-label text-muted">Sort</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value === "look" ? null : e.target.value })}
                className="t-ui cursor-pointer appearance-none rounded-full bg-transparent px-3.5 py-2 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.22)]"
              >
                {SORTS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center rounded-full p-1 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.22)]" role="group" aria-label="View">
              {(["plates", "lineup"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => update({ view: v === "plates" ? null : v })}
                  className={`t-label min-h-[34px] whitespace-nowrap rounded-full px-3.5 py-1.5 ${view === v ? "bg-ink text-washi" : ""}`}
                >
                  {v === "plates" ? "Plates" : "Line-up"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-14 transition-opacity duration-300 ${pending ? "opacity-60" : ""}`}>
        <h2 className="sr-only">Pieces</h2>
        {results.length === 0 ? (
          <div className="flex flex-col items-start gap-5 py-24">
            <p className="t-lede measure">No pieces match these filters.</p>
            <button type="button" className="btn btn-solid" onClick={() => update({ cat: null, colour: null, q: null })}>
              Clear filters
            </button>
          </div>
        ) : view === "plates" ? (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-12 lg:gap-y-24">
            {results.map((p, i) => {
              const r = RHYTHM[i % RHYTHM.length];
              return (
                <li key={p.slug} className={`${r.col} ${r.pad}`}>
                  <ProductPlate product={p} colorway={colorwayOf(p, colour)} aspect={r.aspect} priority={i < 2} />
                </li>
              );
            })}
          </ul>
        ) : (
          <div>
            <p className="t-body measure text-muted">
              Every piece photographed on the same hanger at the same scale, so lengths and widths compare truthfully.
            </p>
            <ul className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-4" data-lenis-prevent>
              {results.map((p) => {
                const cw = colorwayOf(p, colour);
                return (
                  <li key={p.slug} className="w-[min(70vw,340px)] shrink-0">
                    <Link href={`/collection/${p.slug}?c=${cw.id}`} className="group block">
                      <div className="plate relative h-[62svh] min-h-[420px]">
                        <Image src={imageUrl(p, cw.id)} alt={`${p.name} in ${cw.name}`} fill sizes="340px" className="render object-contain" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-3">
                        <span className="t-ui font-medium group-hover:underline">{p.name}</span>
                        <span className="t-label text-muted">{p.sample.length} cm long</span>
                      </div>
                      <p className="t-label mt-1 text-muted">
                        {lookNumber(p.look)}, {formatPrice(s.currency === "EUR" ? p.priceEUR : p.priceUSD, s.currency)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

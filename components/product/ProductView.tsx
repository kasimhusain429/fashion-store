"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ViewTransition, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATALOG_IS_PLACEHOLDER, PRODUCTS, SIZE_LABELS, colorwayOf, getProduct, imageUrl, type Product } from "@/lib/catalog";
import { formatPrice, lookNumber } from "@/lib/format";
import { POLICIES } from "@/lib/site";
import { shop, useShop } from "@/lib/store";
import { ProductPlate } from "@/components/shop/ProductPlate";
import { scrollLock } from "@/components/chrome/SmoothScroll";

const Viewer3D = dynamic(() => import("./Viewer3D").then((m) => m.Viewer3D), {
  ssr: false,
  loading: () => <p className="t-label absolute inset-0 grid place-items-center text-muted">Bringing the piece in</p>,
});

type Shot = "front" | "back" | "collar" | "hem" | "3d";

/*
 * Renders share one orthographic camera (1.25 m tall over 1200 px, top edge 0.24 m above the
 * high shoulder) and one 780x975 crop from (90, 110), so a height on the garment maps to the
 * same point in every image.
 */
function rowFraction(metresBelowShoulder: number) {
  const row = ((0.24 + metresBelowShoulder) / 1.25) * 1200;
  return (row - 110) / 975;
}

function detailOrigin(p: Product, shot: "collar" | "hem") {
  const y = shot === "collar" ? rowFraction(0.04) : rowFraction(p.sample.length / 100 - 0.03);
  return `50% ${Math.round(Math.min(0.97, y) * 100)}%`;
}

function SizeGuide({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    scrollLock.lock();
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      scrollLock.unlock();
    };
  }, [onClose]);
  const rows: [string, string][] = [
    ["Chest, laid flat", `${product.sample.chest} cm`],
    ["Length from the high shoulder", `${product.sample.length} cm`],
  ];
  if (product.sample.sleeve) rows.push(["Sleeve, from the shoulder point", `${product.sample.sleeve} cm`]);
  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <motion.button
        type="button"
        tabIndex={-1}
        aria-label="Close size guide"
        className="absolute inset-0 h-full w-full cursor-default bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sg-title"
        className="grain absolute inset-y-0 right-0 w-full max-w-[480px] overflow-y-auto bg-washi px-6 py-6"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.5, ease: [0.22, 0.8, 0.18, 1] }}
        data-lenis-prevent
      >
        <div className="flex items-baseline justify-between">
          <h2 id="sg-title" className="t-headline text-[26px]">
            Size guide
          </h2>
          <button ref={ref} type="button" onClick={onClose} className="t-ui link">
            Close
          </button>
        </div>
        <p className="t-body mt-6">{product.note}</p>
        <table className="mt-8 w-full">
          <caption className="t-label pb-3 text-left text-muted">{product.name}, size II sample</caption>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t border-line">
                <th scope="row" className="t-ui py-3 text-left font-normal">
                  {k}
                </th>
                <td className="t-num py-3 text-right text-[16px]">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="t-label mt-6 text-muted">
          Taken from the sample pattern. Measurements for sizes I, III and IV will be published with the final size chart.
        </p>
        <Link href="/client-services#sizing" className="t-ui link mt-6 inline-block" onClick={onClose}>
          Compare every piece
        </Link>
      </motion.div>
    </div>
  );
}

export function ProductView({ slug }: { slug: string }) {
  const product = getProduct(slug)!;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const s = useShop();
  const colorway = colorwayOf(product, params.get("c"));
  const [shot, setShot] = useState<Shot>("front");
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [guide, setGuide] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);
  const sizeRef = useRef<HTMLFieldSetElement>(null);
  const price = s.currency === "EUR" ? product.priceEUR : product.priceUSD;
  const saved = s.wishlist.includes(product.slug);
  const idx = PRODUCTS.findIndex((p) => p.slug === product.slug);
  const prev = PRODUCTS[(idx - 1 + PRODUCTS.length) % PRODUCTS.length];
  const next = PRODUCTS[(idx + 1) % PRODUCTS.length];
  const related = [1, 2, 3].map((k) => PRODUCTS[(idx + k) % PRODUCTS.length]);

  useEffect(() => {
    const el = addRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const setColour = (id: string) => router.replace(`${pathname}?c=${id}`, { scroll: false });

  const add = () => {
    if (!size) {
      setError(true);
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    shop.add({ slug: product.slug, colorway: colorway.id, size });
  };

  const shots: { id: Shot; label: string }[] = [
    { id: "front", label: "Front" },
    { id: "back", label: "Back" },
    { id: "collar", label: "Collar" },
    { id: "hem", label: "Hem" },
    { id: "3d", label: "Turn in 3D" },
  ];
  const zoomed = shot === "collar" || shot === "hem";

  return (
    <article className="pb-24 pt-[var(--header-h)]">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:sticky lg:top-[var(--header-h)] lg:col-span-7 lg:h-[calc(100svh-var(--header-h))]">
          <div className="plate relative h-[78svh] lg:h-full">
            {shot === "3d" ? (
              <Viewer3D key={product.slug} product={product} colorHex={colorway.hex} />
            ) : (
              <ViewTransition name={`tee-${product.slug}`} share="morph" default="none">
                <div className="absolute inset-0 overflow-hidden">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.div
                      key={`${colorway.id}-${shot === "back" ? "back" : "front"}`}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45 }}
                    >
                      <Image
                        src={imageUrl(product, colorway.id, shot === "back" ? "back" : "front")}
                        alt={`${product.name} in ${colorway.name}, ${shot === "back" ? "back" : shot === "front" ? "front" : `${shot} detail`}`}
                        fill
                        preload
                        loading="eager"
                        sizes="(min-width: 1024px) 58vw, 100vw"
                        className="render object-contain p-[4%] transition-transform duration-700"
                        style={{
                          transform: zoomed ? "scale(2.6)" : "none",
                          transformOrigin: zoomed ? detailOrigin(product, shot) : "50% 50%",
                          transitionTimingFunction: "var(--ease-cloth)",
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </ViewTransition>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-center p-2.5 sm:p-4">
              <div className="flex max-w-full flex-wrap justify-center gap-0.5 rounded-2xl bg-washi/85 p-1 backdrop-blur-md sm:flex-nowrap sm:gap-1 sm:rounded-full" role="tablist" aria-label="Views">
                {shots.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={shot === t.id}
                    onClick={() => setShot(t.id)}
                    className={`t-label min-h-[34px] whitespace-nowrap rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 ${shot === t.id ? "bg-ink text-washi" : "hover:bg-black/5"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-[var(--gutter)] pt-10 lg:col-span-5 lg:pt-[10vh]">
          <div className="lg:max-w-[440px]">
            <nav aria-label="Breadcrumb" className="t-label text-muted">
              <Link href="/collection" className="hover:underline">
                Collection
              </Link>
              <span aria-hidden="true"> / </span>
              <span>{lookNumber(product.look)}</span>
            </nav>
            <h1 className="t-display mt-4 text-[clamp(44px,5.4vw,84px)]">{product.name}</h1>
            <p className="t-ui mt-3 text-muted">{product.cut}</p>
            <p className="t-headline mt-6 text-[26px]">{formatPrice(price, s.currency)}</p>
            {CATALOG_IS_PLACEHOLDER && <p className="t-label mt-1 text-muted">Placeholder price</p>}

            <fieldset className="mt-10">
              <legend className="t-label">
                Colour <span className="text-muted">{colorway.name}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colorways.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={c.id === colorway.id}
                    onClick={() => setColour(c.id)}
                    className={`t-label flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 ${c.id === colorway.id ? "shadow-[inset_0_0_0_1.5px_#000]" : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)] hover:shadow-[inset_0_0_0_1px_#000]"}`}
                  >
                    <span className="h-6 w-6 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]" style={{ background: c.swatch }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset ref={sizeRef} className="mt-8">
              <div className="flex items-baseline justify-between">
                <legend className="t-label">Size</legend>
                <button type="button" className="t-label link inline-flex min-h-[32px] items-center px-1 -mr-1" onClick={() => setGuide(true)}>
                  Size guide
                </button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    aria-pressed={size === sz}
                    onClick={() => {
                      setSize(sz);
                      setError(false);
                    }}
                    className={`t-label h-12 rounded-full ${size === sz ? "bg-ink text-washi" : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)] hover:shadow-[inset_0_0_0_1px_#000]"}`}
                  >
                    {SIZE_LABELS[sz]}
                  </button>
                ))}
              </div>
              {error && (
                <p className="t-label mt-2 text-[#9b2c1f]" role="alert">
                  Choose a size to add this piece to your bag.
                </p>
              )}
            </fieldset>

            <div className="mt-8 flex gap-2">
              <button ref={addRef} type="button" className="btn btn-solid flex-1" onClick={add}>
                Add to bag
              </button>
              <button type="button" className="btn btn-line" aria-pressed={saved} onClick={() => shop.toggleWish(product.slug)}>
                {saved ? "Saved" : "Save"}
              </button>
            </div>
            <p className="t-label mt-3 text-muted">{POLICIES.delivery}</p>

            <div className="mt-12 border-b border-line">
              {[
                {
                  title: "Construction",
                  body: (
                    <ul className="space-y-2">
                      {product.construction.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  ),
                  open: true,
                },
                { title: "Fit", body: <p>{product.note}</p> },
                {
                  title: "Composition and care",
                  body: (
                    <>
                      <p>{product.composition}.</p>
                      <p className="mt-2">{POLICIES.care}</p>
                    </>
                  ),
                },
                {
                  title: "Delivery and returns",
                  body: (
                    <ul className="space-y-2">
                      <li>{POLICIES.delivery}</li>
                      <li>{POLICIES.dispatch}</li>
                      <li>{POLICIES.returns}</li>
                      <li>{POLICIES.exchange}</li>
                    </ul>
                  ),
                },
              ].map((a) => (
                <details key={a.title} open={a.open} className="group border-t border-line">
                  <summary className="t-ui flex cursor-pointer list-none items-center justify-between py-4 font-medium [&::-webkit-details-marker]:hidden">
                    {a.title}
                    <span aria-hidden="true" className="transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="t-body pb-5 text-[16px]">{a.body}</div>
                </details>
              ))}
            </div>

            <nav aria-label="Other looks" className="mt-10 flex flex-wrap justify-between gap-4 sm:gap-6">
              <Link href={`/collection/${prev.slug}`} transitionTypes={["nav-back"]} className="t-ui link inline-flex min-h-[32px] items-center">
                {lookNumber(prev.look)}, {prev.name}
              </Link>
              <Link href={`/collection/${next.slug}`} transitionTypes={["nav-forward"]} className="t-ui link inline-flex min-h-[32px] items-center text-right">
                {lookNumber(next.look)}, {next.name}
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <section aria-labelledby="related" className="mt-28 px-[var(--gutter)]">
        <h2 id="related" className="t-headline text-[clamp(28px,3.4vw,48px)]">
          Also on the rail
        </h2>
        <ul className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => (
            <li key={p.slug}>
              <ProductPlate product={p} colorway={p.colorways[0]} aspect="3/4" sizes="(min-width: 1024px) 30vw, 100vw" />
            </li>
          ))}
        </ul>
      </section>

      <AnimatePresence>
        {showBar && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-washi/95 px-[var(--gutter)] py-3 backdrop-blur-md lg:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 0.8, 0.18, 1] }}
          >
            <div>
              <p className="t-ui font-medium">{product.name}</p>
              <p className="t-label text-muted">
                {formatPrice(price, s.currency)}
                {size ? `, size ${SIZE_LABELS[size]}` : ""}
              </p>
            </div>
            <button type="button" className="btn btn-solid" onClick={add}>
              {size ? "Add to bag" : "Choose a size"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{guide && <SizeGuide product={product} onClose={() => setGuide(false)} />}</AnimatePresence>
    </article>
  );
}

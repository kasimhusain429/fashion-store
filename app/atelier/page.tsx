import type { Metadata } from "next";
import Link from "next/link";
import { ColourCard } from "@/components/home/ColourCard";
import { PRODUCTS, MODEL_ID } from "@/lib/catalog";
import { lookNumber } from "@/lib/format";
import patterns from "@/lib/patterns.json";
import { EMAIL, HOURS, MANIFESTO, SALONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Atelier",
  description: "VAELIS works between a salon in Paris and an atelier in Kyoto. The six Chrono-Fold patterns, at true scale.",
};

type PatternId = keyof typeof patterns;
const SCALE_W = 160; // cm of pattern width every drawing shares, so scale is true across all six

export default function AtelierPage() {
  return (
    <>
      <section className="grain px-[var(--gutter)] pb-24 pt-[calc(var(--header-h)+10vh)]">
        <p className="t-label text-muted">Paris and Kyoto</p>
        <h1 className="t-display mt-4 text-[clamp(56px,11vw,190px)]">Atelier</h1>
        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <p className="font-serif text-[clamp(28px,3.6vw,52px)] font-light leading-[1.14] lg:col-span-8">{MANIFESTO}</p>
          <div className="t-body space-y-5 lg:col-span-3 lg:col-start-10 lg:self-end">
            <p>
              VAELIS works between a salon in Paris and an atelier in Kyoto. Each piece can be seen and tried by appointment at
              either address.
            </p>
            <p>{HOURS}.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="patterns-title" className="px-[var(--gutter)] py-24 lg:py-32">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="patterns-title" className="t-headline text-[clamp(34px,4.4vw,64px)] lg:col-span-5">
            Six patterns
          </h2>
          <p className="t-body measure lg:col-span-5 lg:col-start-8">
            The front panel of every piece in the collection, drawn to the same scale. The differences are the collection: a
            dropped shoulder, a sleeve cut in one with the body, a column that falls past the hip.
          </p>
        </div>
        <ul className="mt-16 grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3">
          {PRODUCTS.map((p) => {
            const pat = patterns[MODEL_ID[p.slug] as PatternId];
            return (
              <li key={p.slug}>
                <Link href={`/collection/${p.slug}`} className="group block">
                  <svg viewBox={`${-SCALE_W / 2} -4 ${SCALE_W} 92`} className="w-full" role="img" aria-label={`Front pattern of the ${p.name}`}>
                    <line x1={-SCALE_W / 2} x2={SCALE_W / 2} y1="0" y2="0" stroke="rgb(0 0 0 / 0.12)" strokeWidth="0.3" />
                    <path
                      d={pat.front}
                      fill="rgb(236 234 229 / 0.7)"
                      stroke="#000"
                      strokeWidth="0.4"
                      className="transition-[fill] duration-500 group-hover:fill-[rgb(140_99_56/0.2)]"
                    />
                  </svg>
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <span className="t-ui font-medium group-hover:underline">{p.name}</span>
                    <span className="t-label text-muted">{lookNumber(p.look)}</span>
                  </div>
                  <p className="t-label mt-1 text-muted">
                    {p.sample.length} cm long, {Math.round(pat.maxX - pat.minX)} cm across
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <ColourCard />

      <section aria-labelledby="visit-title" className="grain px-[var(--gutter)] py-24 lg:py-32">
        <h2 id="visit-title" className="t-headline text-[clamp(34px,4.4vw,64px)]">
          Visit
        </h2>
        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
          {SALONS.map((s) => (
            <address key={s.city} className="not-italic lg:col-span-4">
              <p className="t-display text-[clamp(40px,5vw,80px)]">{s.city}</p>
              <p className="t-label mt-4 text-muted">{s.name}</p>
              <p className="t-ui mt-2">
                {s.lines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </p>
            </address>
          ))}
          <div className="lg:col-span-3 lg:col-start-10">
            <p className="t-body">Appointments are arranged by email. Tell us which pieces and sizes you would like to try.</p>
            <a href={`mailto:${EMAIL}`} className="btn btn-solid mt-6">
              Email the salon
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

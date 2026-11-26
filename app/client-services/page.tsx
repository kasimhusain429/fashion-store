import type { Metadata } from "next";
import { CATALOG_IS_PLACEHOLDER, PRODUCTS } from "@/lib/catalog";
import { EMAIL, HOURS, POLICIES, SALONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Client services",
  description: "Contact, delivery, returns and sizing for VAELIS.",
};

const SECTIONS = [
  { id: "contact", title: "Contact" },
  { id: "delivery", title: "Delivery and returns" },
  { id: "sizing", title: "Sizing" },
  { id: "care", title: "Care" },
];

export default function ClientServicesPage() {
  return (
    <div className="px-[var(--gutter)] pb-32 pt-[calc(var(--header-h)+8vh)]">
      <h1 className="t-display text-[clamp(48px,8.4vw,140px)]">Client services</h1>
      <div className="mt-16 grid grid-cols-1 gap-14 lg:grid-cols-12">
        <nav aria-label="On this page" className="lg:col-span-3">
          <ul className="t-ui space-y-2 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="link">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-24 lg:col-span-8 lg:col-start-5">
          <section id="contact" aria-labelledby="contact-h" className="scroll-mt-24">
            <h2 id="contact-h" className="t-headline text-[clamp(30px,3.4vw,48px)]">
              Contact
            </h2>
            <div className="t-body mt-6 grid gap-8 sm:grid-cols-2">
              <div>
                <p>Write to the salon for orders, sizing and appointments.</p>
                <a href={`mailto:${EMAIL}`} className="link mt-3 inline-block">
                  {EMAIL}
                </a>
                <p className="mt-3 text-muted">{HOURS}.</p>
              </div>
              {SALONS.map((s) => (
                <address key={s.city} className="not-italic">
                  <p className="t-label text-muted">{s.name}</p>
                  <p className="mt-1">
                    {s.lines.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </p>
                </address>
              ))}
            </div>
          </section>

          <section id="delivery" aria-labelledby="delivery-h" className="scroll-mt-24">
            <h2 id="delivery-h" className="t-headline text-[clamp(30px,3.4vw,48px)]">
              Delivery and returns
            </h2>
            <dl className="mt-6 border-b border-line">
              {[
                ["Delivery", POLICIES.delivery],
                ["Dispatch", POLICIES.dispatch],
                ["Returns", POLICIES.returns],
                ["Exchanges", POLICIES.exchange],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-2 border-t border-line py-5 sm:grid-cols-3">
                  <dt className="t-ui font-medium">{k}</dt>
                  <dd className="t-body sm:col-span-2">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="sizing" aria-labelledby="sizing-h" className="scroll-mt-24">
            <h2 id="sizing-h" className="t-headline text-[clamp(30px,3.4vw,48px)]">
              Sizing
            </h2>
            <p className="t-body measure mt-6">
              Pieces come in sizes I to IV (S to XL). The table gives flat measurements of each size II sample, taken from its
              pattern; the full size chart will follow.
            </p>
            <div className="mt-8 overflow-x-auto" data-lenis-prevent>
              <table className="w-full min-w-[560px]">
                <caption className="sr-only">Size II sample measurements in centimetres</caption>
                <thead>
                  <tr className="t-label text-left text-muted">
                    <th scope="col" className="pb-3 font-medium">
                      Piece
                    </th>
                    <th scope="col" className="pb-3 text-right font-medium">
                      Chest, flat
                    </th>
                    <th scope="col" className="pb-3 text-right font-medium">
                      Length
                    </th>
                    <th scope="col" className="pb-3 text-right font-medium">
                      Sleeve
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCTS.map((p) => (
                    <tr key={p.slug} className="border-t border-line">
                      <th scope="row" className="t-ui py-4 text-left font-normal">
                        {p.name}
                      </th>
                      <td className="t-num py-4 text-right text-[16px]">{p.sample.chest} cm</td>
                      <td className="t-num py-4 text-right text-[16px]">{p.sample.length} cm</td>
                      <td className="t-num py-4 text-right text-[16px]">{p.sample.sleeve ? `${p.sample.sleeve} cm` : "None"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {CATALOG_IS_PLACEHOLDER && <p className="t-label mt-4 text-muted">Sizes are placeholders in this demo catalogue.</p>}
          </section>

          <section id="care" aria-labelledby="care-h" className="scroll-mt-24">
            <h2 id="care-h" className="t-headline text-[clamp(30px,3.4vw,48px)]">
              Care
            </h2>
            <p className="t-body measure mt-6">{POLICIES.care}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

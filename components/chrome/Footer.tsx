import Link from "next/link";
import { CATALOG_IS_PLACEHOLDER } from "@/lib/catalog";
import { EMAIL, HOURS, POLICIES, SALONS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="dark grain relative overflow-hidden" data-header="dark">
      <div className="px-[var(--gutter)] pb-10 pt-24">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="t-lede measure text-washi">Visit a salon. Every piece on the rail can be tried by appointment in Paris or Kyoto.</p>
            <a href={`mailto:${EMAIL}`} className="btn btn-line mt-8 text-washi">
              Book an appointment
            </a>
          </div>
          {SALONS.map((s) => (
            <address key={s.city} className="not-italic lg:col-span-2">
              <h3 className="t-label text-muted-dark">{s.name}</h3>
              <p className="t-ui mt-3 text-washi">
                {s.lines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </p>
            </address>
          ))}
          <div className="lg:col-span-3">
            <h3 className="t-label text-muted-dark">Client services</h3>
            <ul className="t-ui mt-3 space-y-2 text-washi">
              <li>
                <Link className="link" href="/client-services#delivery">
                  Delivery and returns
                </Link>
              </li>
              <li>
                <Link className="link" href="/client-services#sizing">
                  Size guide
                </Link>
              </li>
              <li>
                <a className="link" href={`mailto:${EMAIL}`}>
                  {EMAIL}
                </a>
              </li>
              <li className="text-muted-dark">{HOURS}</li>
            </ul>
          </div>
        </div>

        <p
          aria-hidden="true"
          className="t-display pointer-events-none mt-24 select-none whitespace-nowrap text-center text-[21.5vw] leading-[0.78] text-washi/[0.08]"
        >
          VAELIS
        </p>

        <div className="mt-8 flex flex-col gap-3 border-t border-line-dark pt-6 text-muted-dark sm:flex-row sm:items-center sm:justify-between">
          <p className="t-label">{POLICIES.care}</p>
          {CATALOG_IS_PLACEHOLDER && (
            <p className="t-label">Demo catalogue: product names, prices and sizes are placeholders.</p>
          )}
        </div>
      </div>
    </footer>
  );
}

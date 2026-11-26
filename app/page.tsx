import Link from "next/link";
import { AtelierRail } from "@/components/rail/AtelierRail";
import { PatternToDrape } from "@/components/home/PatternToDrape";
import { ColourCard } from "@/components/home/ColourCard";
import { PleatTeaser } from "@/components/home/PleatTeaser";
import { MANIFESTO, SALONS } from "@/lib/site";

export default function Home() {
  return (
    <>
      <AtelierRail />

      <section aria-labelledby="manifesto" className="grain px-[var(--gutter)] py-28 lg:py-40">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <blockquote className="lg:col-span-8">
            <p id="manifesto" className="font-serif text-[clamp(30px,4.2vw,62px)] font-light leading-[1.12] tracking-[-0.01em]">
              {MANIFESTO}
            </p>
            <footer className="t-label mt-6 text-muted">The house of VAELIS</footer>
          </blockquote>
          <div className="t-body space-y-5 lg:col-span-3 lg:col-start-10 lg:self-end">
            <p>
              Chrono-Fold brings that discipline to the t-shirt: six cuts, from a boxy dropped shoulder to a longline column,
              each built from a flat two-panel pattern.
            </p>
            <p>
              The house works between a salon in {SALONS[0].city} and an atelier in {SALONS[1].city}, where every piece can be tried by
              appointment.
            </p>
            <Link href="/atelier" className="t-ui link inline-flex min-h-[32px] items-center">
              About the atelier
            </Link>
          </div>
        </div>
      </section>

      <PatternToDrape />
      <ColourCard />
      <PleatTeaser />
    </>
  );
}

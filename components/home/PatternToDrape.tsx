"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import patterns from "@/lib/patterns.json";

gsap.registerPlugin(ScrollTrigger);

const P = patterns.monolith;
const STEPS = [
  {
    title: "It starts flat.",
    body: "Every piece on the rail begins as two panels, a front and a back, drawn as one pattern. This is the Monolith Tee, at full size in centimetres.",
  },
  {
    title: "Four seams close it.",
    body: "Shoulders, sleeves and sides are sewn. The neck is finished with a ribbed band; hems and sleeve openings are turned and double-stitched.",
  },
  {
    title: "Then it is hung.",
    body: "What you see on the rail is this pattern, sewn and left to fall from a walnut hanger.",
  },
];

const NOTES: { label: string; at: [number, number] }[] = [
  { label: "Shoulder seam", at: [22, 1] },
  { label: "Sleeve seam", at: [44, 9] },
  { label: "Side seam", at: [29, 52] },
  { label: "Ribbed neck band", at: [-4, 10] },
  { label: "Double-needle hem", at: [-16, 69] },
];

type SeamKey = keyof typeof P.seams;

export function PatternToDrape() {
  const root = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<SVGPathElement>(".pt-outline").forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: reduced ? 0 : len });
      });
      if (reduced) {
        setStep(2);
        return;
      }
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=220%",
          scrub: 0.6,
          pin: ".pt-stage",
          onUpdate(self) {
            setStep(self.progress < 0.34 ? 0 : self.progress < 0.68 ? 1 : 2);
          },
        },
      });
      tl.to(".pt-front .pt-outline", { strokeDashoffset: 0, duration: 1 })
        .to(".pt-back .pt-outline", { strokeDashoffset: 0, duration: 1 }, 0.35)
        .fromTo(".pt-seam", { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.08 }, 1.2)
        .fromTo(".pt-note", { opacity: 0 }, { opacity: 1, duration: 0.35, stagger: 0.1 }, 1.3)
        .to(".pt-back", { x: 0, duration: 1, ease: "power2.inOut" }, 2.2)
        .to(".pt-note", { opacity: 0, duration: 0.3 }, 2.4)
        .to(".pt-svg", { opacity: 0.16, duration: 0.6 }, 3.1)
        .fromTo(".pt-render", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }, 3.1);
    }, el);
    return () => ctx.revert();
  }, []);

  const seamPaths = (keys: SeamKey[]) =>
    keys.flatMap((k) => ((P.seams[k] as string[] | undefined) ?? []).map((d, i) => ({ d, key: `${k}${i}` })));

  return (
    <section ref={root} aria-labelledby="pt-title" className="relative">
      <div className="pt-stage grain flex min-h-[100svh] flex-col gap-8 px-[var(--gutter)] pb-10 pt-[calc(var(--header-h)+4vh)] lg:grid lg:grid-cols-12 lg:items-center lg:gap-6">
        <div className="lg:col-span-4">
          <h2 id="pt-title" className="t-headline text-[clamp(34px,4.4vw,64px)]">
            From pattern to drape
          </h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="measure transition-opacity duration-500"
                style={{ opacity: step === i ? 1 : 0.32 }}
                aria-current={step === i ? "step" : undefined}
              >
                <p className="t-ui font-medium">{s.title}</p>
                <p className="t-body mt-1 text-[16px]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative lg:col-span-8">
          <svg
            className="pt-svg w-full overflow-visible"
            viewBox="-60 -8 248 92"
            role="img"
            aria-label="Flat pattern of the Monolith Tee: front and back panels with seams marked"
          >
            <defs>
              <pattern id="pt-grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M5 0H0V5" fill="none" stroke="rgb(0 0 0 / 0.07)" strokeWidth="0.15" />
              </pattern>
            </defs>
            <rect x="-60" y="-8" width="248" height="92" fill="url(#pt-grid)" />
            <g className="pt-back" transform="translate(128 0)">
              <path className="pt-outline" d={P.back} fill="rgb(236 234 229 / 0.55)" stroke="#000" strokeWidth="0.35" />
              <text x="0" y="40" textAnchor="middle" fontSize="3" fill="#57534d" style={{ fontFamily: "var(--font-display)" }}>
                Back
              </text>
            </g>
            <g className="pt-front">
              <path className="pt-outline" d={P.front} fill="rgb(236 234 229 / 0.8)" stroke="#000" strokeWidth="0.35" />
              {seamPaths(["shoulder", "sleeveTop", "sleeveUnder", "side"]).map((s) => (
                <path key={s.key} className="pt-seam" d={s.d} fill="none" stroke="#8c6338" strokeWidth="0.9" strokeLinecap="round" />
              ))}
              {seamPaths(["neck", "hem", "cuff"]).map((s) => (
                <path key={s.key} className="pt-seam" d={s.d} fill="none" stroke="#000" strokeWidth="0.7" strokeDasharray="1 0.8" />
              ))}
              <text x="0" y="40" textAnchor="middle" fontSize="3" fill="#57534d" style={{ fontFamily: "var(--font-display)" }}>
                Front
              </text>
              {NOTES.map((n) => (
                <g key={n.label} className="pt-note">
                  <circle cx={n.at[0]} cy={n.at[1]} r="0.9" fill="#8c6338" />
                  <text x={n.at[0] + 2.2} y={n.at[1] + 1} fontSize="2.7" fill="#000" style={{ fontFamily: "var(--font-display)" }}>
                    {n.label}
                  </text>
                </g>
              ))}
            </g>
            <g fontSize="2.6" fill="#57534d" style={{ fontFamily: "var(--font-display)" }}>
              <text x={P.minX} y="80">{`${Math.round(P.maxX - P.minX)} cm across the sleeves, laid flat`}</text>
              <text x={P.maxX - 14} y="80">{`${P.maxY} cm long`}</text>
            </g>
          </svg>
          <div className="pt-render pointer-events-none absolute inset-0 flex items-center justify-center opacity-0">
            <Image
              src="/products/monolith/obsidian-front.webp"
              alt="The Monolith Tee in Obsidian Black, sewn and hung on a walnut hanger"
              width={600}
              height={750}
              sizes="(min-width: 1024px) 40vw, 80vw"
              className="h-full max-h-[78svh] w-auto object-contain drop-shadow-[18px_26px_22px_rgb(40_32_24/0.22)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

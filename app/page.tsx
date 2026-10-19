"use client";

import { useState } from "react";
import SmoothScroll from "@/components/providers/SmoothScroll";
import StickyNav from "@/components/nav/StickyNav";
import CartDrawer from "@/components/cart/CartDrawer";
import SectionDrop from "@/components/section1/SectionDrop";
import SectionCraft from "@/components/section2/SectionCraft";
import SectionCollection from "@/components/section3/SectionCollection";
import SectionFinale from "@/components/section4/SectionFinale";

export default function Home() {
  const [activeSection, setActiveSection] = useState(1);

  return (
    <SmoothScroll>
      <main className="relative min-h-screen bg-[#0B0B0C] text-[#EDE9E3] w-full block">
        {/* Pinned Sticky Navigation */}
        <StickyNav activeSection={activeSection} />

        {/* Global Slide-Out Reservation Bag */}
        <CartDrawer />

        {/* SECTION 1: THE DROP */}
        <SectionDrop
          onExitState={(progress) => {
            if (progress > 0.8) {
              setActiveSection(2);
            } else {
              setActiveSection(1);
            }
          }}
        />

        {/* SECTION 2: THE CRAFT */}
        <SectionCraft
          onExitState={(progress) => {
            if (progress > 0.94) {
              setActiveSection(3);
            } else if (progress > 0.08) {
              setActiveSection(2);
            }
          }}
        />

        {/* SECTION 3: THE COLLECTION IN MOTION */}
        <SectionCollection
          onExitState={(progress) => {
            if (progress > 0.85) {
              setActiveSection(4);
            } else if (progress > 0.1) {
              setActiveSection(3);
            }
          }}
        />

        {/* SECTION 4: PROOF AND FINALE */}
        <SectionFinale
          onExitState={(progress) => {
            if (progress > 0.1) {
              setActiveSection(4);
            }
          }}
        />
      </main>
    </SmoothScroll>
  );
}

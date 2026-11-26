import type { Metadata } from "next";
import { LookbookScroller } from "@/components/lookbook/LookbookScroller";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Chrono-Fold: six VAELIS t-shirts on one walnut hanger, in the same light at the same scale.",
};

export default function LookbookPage() {
  return <LookbookScroller />;
}

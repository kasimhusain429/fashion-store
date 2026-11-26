import type { Metadata, Viewport } from "next";
import { Archivo, Newsreader } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { CartDrawer } from "@/components/chrome/CartDrawer";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://vaelis-atelier.com"),
  title: { default: "VAELIS — Chrono-Fold", template: "%s — VAELIS" },
  description:
    "Chrono-Fold: six t-shirts cut as architecture by VAELIS, Paris and Kyoto. Browse the rail, turn each piece in 3D, and order online.",
  openGraph: {
    title: "VAELIS — Chrono-Fold",
    description: "Six t-shirts cut as architecture. Paris and Kyoto.",
    siteName: "VAELIS",
    images: [{ url: "/products/monolith/obsidian-front.webp", width: 780, height: 975, alt: "Monolith Tee in Obsidian Black on a walnut hanger" }],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#d8d5ce",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${newsreader.variable}`}>
      <body>
        <a
          href="#main"
          className="t-label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-washi focus:px-4 focus:py-3"
        >
          Skip to content
        </a>
        <SmoothScroll />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}

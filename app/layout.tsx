import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAELIS — Chrono-Fold | Haute Couture Digital Runway",
  description:
    "Architectural motion suspended in time. Explore the Monolith Cocoon Trench and limited-edition archival tailoring by Atelier Vaelis.",
  keywords: [
    "Vaelis",
    "Haute Couture",
    "Luxury Outerwear",
    "Monolith Cocoon Trench",
    "Bonded Silk Wool",
    "Architectural Tailoring",
  ],
  authors: [{ name: "Atelier Vaelis" }],
  openGraph: {
    title: "VAELIS — Chrono-Fold",
    description: "Architectural motion suspended in time. The Monolith Cocoon Trench.",
    url: "https://vaelis-atelier.com",
    siteName: "VAELIS",
    images: [
      {
        url: "/assets/s1_hero_trench_ref.jpg",
        width: 1200,
        height: 1600,
        alt: "The Monolith Cocoon Trench by Atelier Vaelis",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[#C5A880] selection:text-[#0B0B0C]">
        <div className="grain-overlay" aria-hidden="true" />
        <div className="ambient-glow-top" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}

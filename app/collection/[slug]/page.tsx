import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PRODUCTS, getProduct, imageUrl } from "@/lib/catalog";
import { ProductView } from "@/components/product/ProductView";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.name,
    description: `${p.name}: ${p.cut}. ${p.construction[0]}.`,
    openGraph: { images: [{ url: imageUrl(p, p.colorways[0].id), width: 780, height: 975 }] },
  };
}

async function ProductRoute({ params }: Props) {
  const { slug } = await params;
  if (!getProduct(slug)) notFound();
  return <ProductView slug={slug} />;
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <ProductRoute params={params} />
    </Suspense>
  );
}

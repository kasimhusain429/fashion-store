import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80svh] flex-col items-start justify-end gap-8 px-[var(--gutter)] pb-24 pt-[calc(var(--header-h)+10vh)]">
      <h1 className="t-display text-[clamp(56px,11vw,190px)]">Not on the rail</h1>
      <p className="t-lede measure">This page does not exist. The collection is a step away.</p>
      <Link href="/collection" className="btn btn-solid">
        Browse the collection
      </Link>
    </div>
  );
}

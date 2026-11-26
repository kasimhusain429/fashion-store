"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SIZE_LABELS, colorwayOf, getProduct, imageUrl } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { COUNTRIES, validateOrder, type FieldErrors } from "@/lib/orders";
import { POLICIES } from "@/lib/site";
import { cartSubtotal, shop, unitPrice, useShop } from "@/lib/store";

type Step = 1 | 2 | 3;

interface Form {
  email: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

const EMPTY: Form = { email: "", name: "", phone: "", line1: "", line2: "", city: "", postcode: "", country: "" };

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  optional,
}: {
  label: string;
  name: keyof Form;
  value: string;
  onChange: (name: keyof Form, v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  optional?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="t-label text-muted">
        {label}
        {optional && " (optional)"}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className="field"
      />
      {error && (
        <p id={`${id}-err`} className="t-label mt-1.5 text-[#9b2c1f]">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutFlow() {
  const s = useShop();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; total: number; currency: "EUR" | "USD"; email: string } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const subtotal = cartSubtotal(s);

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as keyof FieldErrors]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const payload = () => ({
    email: form.email,
    name: form.name,
    phone: form.phone,
    address: { line1: form.line1, line2: form.line2, city: form.city, postcode: form.postcode, country: form.country },
    currency: s.currency,
    lines: s.lines,
  });

  const check = (fields: (keyof FieldErrors)[]) => {
    const r = validateOrder(payload());
    if (r.ok) return true;
    const relevant = Object.fromEntries(Object.entries(r.errors).filter(([k]) => fields.includes(k as keyof FieldErrors)));
    setErrors(relevant);
    return Object.keys(relevant).length === 0;
  };

  const go = (n: Step) => {
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const place = async () => {
    setFailure(null);
    if (!check(["email", "name", "line1", "city", "postcode", "country", "lines"])) return;
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          setFailure(data.errors.lines ?? "Some details need attention before the order can be sent.");
        } else setFailure(data.error ?? "The order could not be sent. Try again.");
        return;
      }
      setDone(data);
      shop.clear();
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setFailure("The order could not be sent: check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div ref={topRef} className="px-[var(--gutter)] pb-32 pt-[calc(var(--header-h)+10vh)]">
        <p className="t-label text-muted">Order request {done.reference}</p>
        <h1 className="t-display mt-4 text-[clamp(44px,7vw,110px)]">Received</h1>
        <div className="t-body measure mt-8 space-y-4">
          <p>
            Your order request for {formatPrice(done.total, done.currency)} has been passed to the salon, who will contact you at{" "}
            {done.email} to confirm availability.
          </p>
          <p className="text-muted">{POLICIES.dispatch}</p>
        </div>
        <Link href="/collection" className="btn btn-solid mt-10">
          Back to the collection
        </Link>
      </div>
    );
  }

  if (s.hydrated && s.lines.length === 0) {
    return (
      <div className="px-[var(--gutter)] pb-32 pt-[calc(var(--header-h)+10vh)]">
        <h1 className="t-display text-[clamp(44px,7vw,110px)]">Checkout</h1>
        <p className="t-lede measure mt-8">Your bag is empty. Add a piece from the rail to check out.</p>
        <Link href="/collection" className="btn btn-solid mt-8">
          Browse the collection
        </Link>
      </div>
    );
  }

  const steps: { n: Step; title: string }[] = [
    { n: 1, title: "Contact" },
    { n: 2, title: "Delivery" },
    { n: 3, title: "Review and send" },
  ];

  return (
    <div ref={topRef} className="scroll-mt-20 px-[var(--gutter)] pb-32 pt-[calc(var(--header-h)+6vh)]">
      <h1 className="t-display text-[clamp(44px,7vw,110px)]">Checkout</h1>
      <div className="mt-12 grid grid-cols-1 gap-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ol className="space-y-2">
            {steps.map((st) => {
              const active = step === st.n;
              const complete = step > st.n;
              return (
                <li key={st.n} className="border-t border-line">
                  <div className="flex items-baseline justify-between py-5">
                    <h2 className={`t-headline text-[24px] ${active || complete ? "" : "text-muted"}`} aria-current={active ? "step" : undefined}>
                      <span className="t-num mr-3 text-[18px]">{st.n}</span>
                      {st.title}
                    </h2>
                    {complete && (
                      <button type="button" className="t-label link inline-flex min-h-[28px] items-center" onClick={() => go(st.n)}>
                        Edit
                      </button>
                    )}
                  </div>
                  {complete && st.n === 1 && <p className="t-ui -mt-2 pb-5 text-muted">{form.email}</p>}
                  {complete && st.n === 2 && (
                    <p className="t-ui -mt-2 pb-5 text-muted">
                      {form.name}, {form.line1}, {form.city} {form.postcode}, {form.country}
                    </p>
                  )}
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 0.8, 0.18, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-10">
                          {st.n === 1 && (
                            <form
                              noValidate
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (check(["email"])) go(2);
                              }}
                              className="space-y-6"
                            >
                              <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set} error={errors.email} />
                              <p className="t-label text-muted">The salon uses it to confirm your order.</p>
                              <button type="submit" className="btn btn-solid">
                                Continue to delivery
                              </button>
                            </form>
                          )}
                          {st.n === 2 && (
                            <form
                              noValidate
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (check(["name", "line1", "city", "postcode", "country"])) go(3);
                              }}
                              className="grid gap-6 sm:grid-cols-2"
                            >
                              <div className="sm:col-span-2">
                                <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={set} error={errors.name} />
                              </div>
                              <div className="sm:col-span-2">
                                <Field label="Street address" name="line1" autoComplete="address-line1" value={form.line1} onChange={set} error={errors.line1} />
                              </div>
                              <div className="sm:col-span-2">
                                <Field label="Apartment, floor" name="line2" autoComplete="address-line2" value={form.line2} onChange={set} optional />
                              </div>
                              <Field label="Town or city" name="city" autoComplete="address-level2" value={form.city} onChange={set} error={errors.city} />
                              <Field label="Postcode" name="postcode" autoComplete="postal-code" value={form.postcode} onChange={set} error={errors.postcode} />
                              <div>
                                <label htmlFor="country" className="t-label text-muted">
                                  Country
                                </label>
                                <select
                                  id="country"
                                  value={form.country}
                                  autoComplete="country-name"
                                  onChange={(e) => set("country", e.target.value)}
                                  aria-invalid={!!errors.country}
                                  className="field cursor-pointer"
                                >
                                  <option value="">Choose a country</option>
                                  {COUNTRIES.map((c) => (
                                    <option key={c}>{c}</option>
                                  ))}
                                </select>
                                {errors.country && <p className="t-label mt-1.5 text-[#9b2c1f]">{errors.country}</p>}
                              </div>
                              <Field label="Phone, for the courier" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set} optional />
                              <div className="sm:col-span-2">
                                <p className="t-label text-muted">Delivery method</p>
                                <p className="t-ui mt-2">{POLICIES.delivery}</p>
                              </div>
                              <div className="sm:col-span-2">
                                <button type="submit" className="btn btn-solid">
                                  Review the order
                                </button>
                              </div>
                            </form>
                          )}
                          {st.n === 3 && (
                            <div className="space-y-6">
                              <div className="t-body measure space-y-3 text-[16px]">
                                <p>
                                  No payment is taken on this site yet. Sending the order passes the request to the salon, who will
                                  contact you to confirm availability before dispatch.
                                </p>
                                <p className="text-muted">
                                  {POLICIES.returns} {POLICIES.exchange}
                                </p>
                              </div>
                              {failure && (
                                <p className="t-ui text-[#9b2c1f]" role="alert">
                                  {failure}
                                </p>
                              )}
                              <button type="button" className="btn btn-solid" onClick={place} disabled={busy}>
                                {busy ? "Sending the order request" : `Send order request, ${formatPrice(subtotal, s.currency)}`}
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ol>
        </div>

        <aside aria-label="Order summary" className="lg:col-span-4 lg:col-start-9">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            <h2 className="t-headline text-[24px]">Your bag</h2>
            <ul className="mt-6 border-t border-line">
              {s.lines.map((l) => {
                const p = getProduct(l.slug);
                if (!p) return null;
                const cw = colorwayOf(p, l.colorway);
                return (
                  <li key={`${l.slug}${l.colorway}${l.size}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-line py-4">
                    <div className="plate aspect-[4/5]">
                      <Image src={imageUrl(p, cw.id)} alt="" width={128} height={160} className="render h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className="t-ui">{p.name}</p>
                      <p className="t-label text-muted">
                        {cw.name}, size {SIZE_LABELS[l.size]}, quantity {l.qty}
                      </p>
                    </div>
                    <p className="t-ui">{formatPrice(unitPrice(l.slug, s.currency) * l.qty, s.currency)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-5 space-y-2">
              <div className="t-ui flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal, s.currency)}</dd>
              </div>
              <div className="t-ui flex justify-between">
                <dt>Delivery</dt>
                <dd>Complimentary</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="t-ui font-medium">Total</dt>
                <dd className="t-headline text-[24px]">{formatPrice(subtotal, s.currency)}</dd>
              </div>
            </dl>
            <button type="button" className="t-label link mt-3 inline-flex min-h-[28px] items-center text-muted" onClick={shop.openCart}>
              Edit the bag
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

import { randomBytes } from "node:crypto";
import { priceOrder, validateOrder } from "@/lib/orders";

/**
 * Order requests. No payment provider is connected to this project: the request is
 * validated and priced from the catalog on the server, and a reference is returned.
 * Connect a payment provider and persistence here before taking real orders.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The order could not be read. Try again." }, { status: 400 });
  }
  const result = validateOrder(body);
  if (!result.ok) {
    return Response.json({ errors: result.errors }, { status: 422 });
  }
  const priced = priceOrder(result.order);
  const reference = `VA-${randomBytes(3).toString("hex").toUpperCase()}`;
  return Response.json({
    reference,
    currency: result.order.currency,
    subtotal: priced.subtotal,
    delivery: priced.delivery,
    total: priced.subtotal + priced.delivery,
    email: result.order.email,
  });
}

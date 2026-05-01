import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe não configurado." },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json(
      { error: "Assinatura inválida." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data
      .object as import("stripe").Stripe.Checkout.Session;
    const trainerId = session.metadata?.trainer_id;

    if (trainerId) {
      const supabase = await createClient();
      await supabase
        .from("trainers")
        .update({ plan: "pro" })
        .eq("id", trainerId);
    }
  }

  return NextResponse.json({ received: true });
}

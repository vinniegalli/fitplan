"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "mensal",
    label: "Mensal",
    price: "R$\u00a029,90",
    period: "/mês",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL ?? "price_mensal",
    highlight: false,
    description: "Para quem quer começar",
  },
  {
    id: "trimestral",
    label: "Trimestral",
    price: "R$\u00a079,90",
    period: "/3 meses",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIMESTRAL ?? "price_trimestral",
    highlight: false,
    description: "Equivale a R$26,63/mês",
  },
  {
    id: "semestral",
    label: "Semestral",
    price: "R$\u00a0159,90",
    period: "/6 meses",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMESTRAL ?? "price_semestral",
    highlight: true,
    description: "Equivale a R$26,65/mês",
  },
  {
    id: "anual",
    label: "Anual",
    price: "R$\u00a0329,90",
    period: "/12 meses",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL ?? "price_anual",
    highlight: false,
    description: "Equivale a R$27,49/mês",
  },
];

export default function PricingClient() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCheckout(priceId: string, planId: string) {
    setLoading(planId);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao iniciar checkout.");
        return;
      }
      if (data.url) {
        router.push(data.url);
      }
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {error && (
        <p
          style={{
            color: "var(--primary)",
            textAlign: "center",
            marginBottom: "24px",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="card"
            style={{
              padding: "28px 24px",
              textAlign: "center",
              border: plan.highlight
                ? "2px solid var(--primary)"
                : "1px solid var(--border)",
              position: "relative",
            }}
          >
            {plan.highlight && (
              <span
                style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--primary)",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  padding: "3px 10px",
                  borderRadius: "999px",
                }}
              >
                Popular
              </span>
            )}
            <p
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.4rem",
                letterSpacing: "2px",
                color: "var(--text)",
                marginBottom: "4px",
              }}
            >
              {plan.label}
            </p>
            <p
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "2.4rem",
                color: "var(--primary)",
                lineHeight: 1,
              }}
            >
              {plan.price}
              <span
                style={{
                  fontSize: "1rem",
                  color: "var(--muted)",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 400,
                }}
              >
                {plan.period}
              </span>
            </p>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "0.78rem",
                marginTop: "6px",
                marginBottom: "20px",
              }}
            >
              {plan.description}
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={loading === plan.id}
              onClick={() => handleCheckout(plan.priceId, plan.id)}
            >
              {loading === plan.id ? "Aguarde..." : "Assinar"}
            </button>
          </div>
        ))}
      </div>

      <p
        style={{
          textAlign: "center",
          color: "var(--muted)",
          fontSize: "0.78rem",
          marginTop: "32px",
        }}
      >
        Pagamento seguro via Stripe. Cancele a qualquer momento.
      </p>
    </div>
  );
}

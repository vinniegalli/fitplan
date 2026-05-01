import Link from "next/link";

export const metadata = { title: "Assinatura confirmada — FitPlan" };

export default function PricingSuccess() {
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="logo">
            FIT<span>PLAN</span>
          </div>
        </div>
      </header>

      <div
        className="container"
        style={{
          maxWidth: "480px",
          textAlign: "center",
          paddingTop: "80px",
          paddingBottom: "80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ fontSize: "3rem", lineHeight: 1 }}>🎉</div>
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "2.2rem",
            letterSpacing: "2px",
            color: "var(--text)",
          }}
        >
          Assinatura Confirmada!
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Seu plano PRO está ativo. Aproveite todos os recursos sem limitações.
        </p>
        <Link
          href="/dashboard"
          className="btn btn-primary"
          style={{ marginTop: "8px" }}
        >
          Ir para o dashboard
        </Link>
      </div>
    </>
  );
}

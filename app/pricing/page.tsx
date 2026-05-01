import PricingClient from "./PricingClient";

export const metadata = { title: "Planos PRO — FitPlan" };

export default function PricingPage() {
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
        style={{ paddingTop: "60px", paddingBottom: "80px" }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              letterSpacing: "3px",
              color: "var(--text)",
              marginBottom: "12px",
            }}
          >
            Escolha seu plano PRO
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "1rem",
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            Alunos ilimitados, vídeos personalizados por exercício e mais.
            Cancele quando quiser.
          </p>
        </div>

        <PricingClient />
      </div>
    </>
  );
}

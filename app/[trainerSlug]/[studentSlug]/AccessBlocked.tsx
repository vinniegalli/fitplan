"use client";

interface Props {
  trainerName: string;
}

export default function AccessBlocked({ trainerName }: Props) {
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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          paddingTop: "80px",
          paddingBottom: "80px",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontSize: "3rem",
            lineHeight: 1,
            color: "var(--primary)",
          }}
        >
          🔒
        </div>
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "2.2rem",
            letterSpacing: "2px",
            color: "var(--text)",
          }}
        >
          Acesso Suspenso
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Seu acesso foi bloqueado. Entre em contato com{" "}
          <strong style={{ color: "var(--text)" }}>{trainerName}</strong> para
          regularizar sua situação.
        </p>
      </div>
    </>
  );
}

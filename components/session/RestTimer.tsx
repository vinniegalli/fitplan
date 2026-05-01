"use client";

import { useRestTimer } from "@/lib/hooks/useRestTimer";

interface Props {
  restSeconds: number;
  autoStart?: boolean;
}

export default function RestTimer({ restSeconds, autoStart }: Props) {
  const { seconds, running, formatted, start, stop } =
    useRestTimer(restSeconds);

  // Auto-start is handled externally via the start ref — this component is
  // purely presentational but exposes start/stop via the hook above.
  // The parent triggers autoStart by calling the timer directly; here we
  // show an inline timer if already running.
  void autoStart; // reserved for parent usage

  if (!running && seconds === 0) {
    return (
      <button
        onClick={() => start()}
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "0.75rem",
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "var(--muted)",
          background: "transparent",
          border: "1px dashed var(--border)",
          borderRadius: "4px",
          padding: "4px 10px",
          cursor: "pointer",
        }}
      >
        ▶ Iniciar descanso ({Math.floor(restSeconds / 60)}:
        {String(restSeconds % 60).padStart(2, "0")})
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "6px 12px",
        background: "rgba(232,25,44,0.08)",
        border: "1px solid var(--primary-dim)",
        borderRadius: "6px",
      }}
    >
      <span
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "2rem",
          color: seconds <= 5 ? "var(--primary)" : "var(--text)",
          lineHeight: 1,
          minWidth: "4ch",
        }}
      >
        {formatted}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.65rem",
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {running ? "Descansando..." : "Pronto!"}
        </span>
        <button
          onClick={stop}
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.7rem",
            color: "var(--muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          Pular
        </button>
      </div>
    </div>
  );
}

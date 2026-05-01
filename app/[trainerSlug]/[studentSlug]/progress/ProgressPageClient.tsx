"use client";

import { useState, useEffect } from "react";
import type { TrainerTheme } from "@/lib/types";
import ProgressChart from "@/components/session/ProgressChart";

interface DataPoint {
  date: string;
  week: number;
  maxWeight: number;
  totalVolume: number;
  totalReps: number;
  sets: number;
}

interface ExerciseProgress {
  exercise_id: string;
  name: string;
  dataPoints: DataPoint[];
}

type PeriodFilter = "4w" | "8w" | "12w" | "all";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "4w", label: "4 semanas" },
  { value: "8w", label: "8 semanas" },
  { value: "12w", label: "12 semanas" },
  { value: "all", label: "Tudo" },
];

function getFromDate(filter: PeriodFilter): string | undefined {
  if (filter === "all") return undefined;
  const weeks = filter === "4w" ? 4 : filter === "8w" ? 8 : 12;
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().slice(0, 10);
}

interface Props {
  trainerSlug: string;
  studentSlug: string;
  student: { id: string; name: string; slug: string };
  theme: TrainerTheme;
}

function themeVars(t: TrainerTheme): React.CSSProperties {
  return {
    "--primary": t.primary,
    "--primary-dim": t.primaryDim,
    "--bg": t.bg,
    "--surface": t.surface,
    "--surface2": t.surface2,
    "--border": t.border,
    "--text": t.text,
    "--muted": t.muted,
    "--accent": t.accent,
    "--red": t.primary,
    "--red-dim": t.primaryDim,
  } as React.CSSProperties;
}

export default function ProgressPageClient({
  trainerSlug,
  studentSlug,
  student,
  theme,
}: Props) {
  const [filter, setFilter] = useState<PeriodFilter>("8w");
  const [data, setData] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const from = getFromDate(filter);
    const url = `/api/students/${student.id}/progress${from ? `?from=${from}` : ""}`;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(url);
        const d = await r.json();
        if (!Array.isArray(d)) throw new Error(d.error ?? "Erro desconhecido");
        setData(d);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [student.id, filter]);

  const chartTheme = {
    primary: theme.primary,
    surface: theme.surface2,
    border: theme.border,
    text: theme.text,
    muted: theme.muted,
  };

  return (
    <div style={themeVars(theme)}>
      <header className="site-header">
        <div
          className="site-header-inner"
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <div className="logo" style={{ fontSize: "1.6rem" }}>
                FIT<span>PLAN</span>
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginTop: "2px",
                }}
              >
                Progresso · {student.name}
              </div>
            </div>
            <a
              href={`/${trainerSlug}/${studentSlug}`}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.72rem",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--muted)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "4px 10px",
                textDecoration: "none",
              }}
            >
              ← Plano
            </a>
          </div>

          {/* Period filter */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`wk-btn${filter === opt.value ? " active" : ""}`}
                style={{ fontSize: "0.75rem", padding: "4px 12px" }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: "20px" }}>
        {loading && (
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: "var(--muted)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontSize: "0.8rem",
            }}
          >
            Carregando...
          </p>
        )}

        {error && (
          <p style={{ color: "var(--primary)", fontSize: "0.85rem" }}>
            {error}
          </p>
        )}

        {!loading && !error && data.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--muted)",
            }}
          >
            <p
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "2rem",
                letterSpacing: "2px",
                marginBottom: "8px",
              }}
            >
              Nenhum dado ainda
            </p>
            <p
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.9rem",
              }}
            >
              Complete treinos para visualizar sua progressão aqui.
            </p>
          </div>
        )}

        {!loading &&
          data.map((ex) => (
            <ProgressChart
              key={ex.exercise_id}
              dataPoints={ex.dataPoints}
              exerciseName={ex.name}
              theme={chartTheme}
            />
          ))}
      </div>
    </div>
  );
}

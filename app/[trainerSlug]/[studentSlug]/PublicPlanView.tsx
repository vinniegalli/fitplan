"use client";

import { useState } from "react";
import BoltIcon from "@mui/icons-material/Bolt";
import type {
  Student,
  TrainingPlan,
  WorkoutDay,
  Exercise,
  PeriodizationWeek,
  TrainerTheme,
  VideoType,
} from "@/lib/types";

function ExerciseVideo({ url, type }: { url: string; type: VideoType | null }) {
  function getYouTubeEmbedUrl(u: string): string | null {
    try {
      const parsed = new URL(u);
      if (
        parsed.hostname.includes("youtube.com") ||
        parsed.hostname.includes("youtu.be")
      ) {
        const id =
          parsed.searchParams.get("v") ||
          (parsed.hostname === "youtu.be" ? parsed.pathname.slice(1) : null) ||
          (parsed.pathname.startsWith("/embed/")
            ? parsed.pathname.split("/")[2]
            : null);
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
    } catch {
      // ignore
    }
    return null;
  }

  const embedUrl = type === "external" ? getYouTubeEmbedUrl(url) : null;

  if (embedUrl) {
    return (
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          borderRadius: "6px",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <iframe
          src={embedUrl}
          title="Demonstração"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    );
  }

  return (
    <video
      src={url}
      controls
      preload="metadata"
      playsInline
      style={{
        width: "100%",
        maxHeight: "260px",
        borderRadius: "6px",
        background: "#000",
        display: "block",
      }}
    >
      <track kind="captions" />
    </video>
  );
}

interface Props {
  trainerName: string;
  trainerSlug: string;
  studentSlug: string;
  student: Student;
  plan: TrainingPlan;
  days: WorkoutDay[];
  exercisesByDay: Record<string, Exercise[]>;
  periodWeeks: PeriodizationWeek[];
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

export default function PublicPlanView({
  trainerName,
  trainerSlug,
  studentSlug,
  student,
  plan,
  days,
  exercisesByDay,
  periodWeeks,
  theme,
}: Props) {
  const [activeDay, setActiveDay] = useState<string>(days[0]?.id ?? "");
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [section, setSection] = useState<"workout" | "period">("workout");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const currentDay = days.find((d) => d.id === activeDay);
  const currentExercises = exercisesByDay[activeDay] ?? [];
  const currentPeriod = periodWeeks.find((w) => w.week_number === activeWeek);

  function getVolume(ex: Exercise): string {
    if (!currentPeriod) return "— × —";
    if (ex.type === "cluster" && currentPeriod.is_cluster && ex.cluster_block) {
      return `${currentPeriod.sets_range} × ${ex.cluster_block}`;
    }
    return `${currentPeriod.sets_range} × ${currentPeriod.reps_range}`;
  }

  function isClusterActive(ex: Exercise): boolean {
    return ex.type === "cluster" && !!currentPeriod?.is_cluster;
  }

  const volLabelClass = (label: string | null) => {
    if (!label) return "pill pill-baixo";
    const l = label.toLowerCase();
    if (l.includes("deload")) return "pill pill-deload";
    if (l.includes("alto")) return "pill pill-alto";
    if (l.includes("médio")) return "pill pill-medio";
    return "pill pill-baixo";
  };

  const intLabelClass = (label: string | null) => {
    if (!label) return "pill pill-baixo";
    if (label === "Alta") return "pill pill-alto";
    if (label === "Média") return "pill pill-medio";
    return "pill pill-baixo";
  };

  return (
    <div style={themeVars(theme)}>
      {/* Header */}
      <header className="site-header">
        <div
          className="site-header-inner"
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <div className="logo" style={{ fontSize: "2rem" }}>
                FIT<span>PLAN</span>
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginTop: "2px",
                }}
              >
                por {trainerName}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span className="badge">{student.name}</span>
              {student.weight && (
                <span className="badge">{student.weight}kg</span>
              )}
              {student.level && (
                <span className="badge badge-red">{student.level}</span>
              )}
              <span className="badge">
                {plan.division_type} · {plan.total_weeks}sem
              </span>
            </div>
          </div>

          {/* Week selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginRight: "2px",
              }}
            >
              Semana:
            </span>
            {periodWeeks.map((pw) => {
              const isDeload = pw.volume_label
                ?.toLowerCase()
                .includes("deload");
              const isCluster = pw.is_cluster;
              return (
                <button
                  key={pw.week_number}
                  onClick={() => setActiveWeek(pw.week_number)}
                  className={[
                    "wk-btn",
                    activeWeek === pw.week_number ? "active" : "",
                    isDeload ? "is-deload" : "",
                    isCluster ? "is-cluster" : "",
                  ]
                    .join(" ")
                    .trim()}
                >
                  S{pw.week_number}
                </button>
              );
            })}
            {currentPeriod && (
              <span className="wk-info">
                S{activeWeek} · {currentPeriod.sets_range} ×{" "}
                {currentPeriod.reps_range} · {currentPeriod.volume_label}
              </span>
            )}
          </div>

          {/* Section nav */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {days.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setActiveDay(d.id);
                  setSection("workout");
                }}
                className={`wk-btn${activeDay === d.id && section === "workout" ? " active" : ""}`}
                style={{ fontSize: "0.8rem", padding: "5px 12px" }}
              >
                {d.label}
              </button>
            ))}
            <button
              onClick={() => setSection("period")}
              className={`wk-btn${section === "period" ? " active" : ""}`}
              style={{ fontSize: "0.8rem", padding: "5px 12px" }}
            >
              Periodização
            </button>
            <a
              href={`/${trainerSlug}/${studentSlug}/progress`}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.8rem",
                padding: "5px 12px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--muted)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              📈 Progresso
            </a>
          </div>
        </div>
      </header>

      <div className="container">
        {/* ── WORKOUT VIEW ── */}
        {section === "workout" && currentDay && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <h1
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "3rem",
                  color: "var(--primary)",
                  lineHeight: 1,
                  letterSpacing: "2px",
                }}
              >
                {currentDay.label}
              </h1>
              {currentDay.focus && (
                <p
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    color: "var(--muted)",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    fontSize: "0.9rem",
                    marginTop: "4px",
                  }}
                >
                  {currentDay.focus}
                </p>
              )}
              <a
                href={`/${trainerSlug}/${studentSlug}/session?day=${currentDay.id}&week=${activeWeek}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "12px",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1rem",
                  letterSpacing: "2px",
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 22px",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                ▶ Iniciar Treino
              </a>
            </div>

            {currentDay.warmup && (
              <div
                style={{
                  background: "rgba(232,25,44,0.05)",
                  border: "1px solid var(--primary-dim)",
                  borderLeft: "3px solid var(--primary)",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontSize: "0.85rem",
                  color: "var(--muted)",
                }}
              >
                <strong
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "0.7rem",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  <BoltIcon
                    sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }}
                  />
                  Aquecimento
                </strong>
                {currentDay.warmup}
              </div>
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {currentExercises.map((ex, i) => {
                const clusterActive = isClusterActive(ex);
                const isOpen = expandedExercise === ex.id;
                const hasDetails = !!(ex.notes || ex.video_url);

                return (
                  <div
                    key={ex.id}
                    style={{
                      background: "var(--surface)",
                      border: `1px solid ${isOpen ? "var(--primary-dim)" : "var(--border)"}`,
                      borderLeft: `3px solid ${isOpen ? "var(--primary)" : "transparent"}`,
                      borderRadius: "4px",
                      overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}
                  >
                    {/* ── Collapsed row — always visible ── */}
                    <button
                      onClick={() => setExpandedExercise(isOpen ? null : ex.id)}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        cursor: hasDetails ? "pointer" : "default",
                        padding: "12px 14px",
                        display: "grid",
                        gridTemplateColumns: "28px 1fr auto auto",
                        alignItems: "center",
                        gap: "10px",
                        textAlign: "left",
                      }}
                    >
                      {/* Index */}
                      <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--muted)",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      {/* Name + tags */}
                      <div>
                        <span
                          style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: "1rem",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            color: "var(--text)",
                          }}
                        >
                          {ex.name}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            marginTop: "4px",
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <span className="vol-chip">{getVolume(ex)}</span>
                          {ex.rest_time && (
                            <span className="rest-chip">{ex.rest_time}</span>
                          )}
                          {ex.type === "compound" && (
                            <span className="ex-tag">Composto</span>
                          )}
                          {ex.type === "cluster" && (
                            <span
                              className={`ex-tag ex-tag-cluster${clusterActive ? "" : " ex-tag-dimmed"}`}
                            >
                              Cluster
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Video indicator */}
                      {ex.video_url && (
                        <span
                          style={{
                            fontSize: "0.9rem",
                            opacity: 0.6,
                          }}
                        >
                          ▶
                        </span>
                      )}

                      {/* Chevron — only if there's content to expand */}
                      {hasDetails && (
                        <span
                          style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: "0.75rem",
                            color: "var(--muted)",
                            transform: isOpen ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                            display: "inline-block",
                            userSelect: "none",
                          }}
                        >
                          ▾
                        </span>
                      )}
                    </button>

                    {/* ── Expanded details ── */}
                    {isOpen && (
                      <div
                        style={{
                          padding: "0 14px 14px",
                          borderTop: "1px solid var(--border)",
                          paddingTop: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* Video */}
                        {ex.video_url && (
                          <ExerciseVideo
                            url={ex.video_url}
                            type={ex.video_type}
                          />
                        )}

                        {/* Notes */}
                        {ex.notes && (
                          <div className="ex-note">
                            {ex.type === "cluster"
                              ? clusterActive
                                ? ex.notes
                                : "Séries convencionais. RIR 1–2."
                              : ex.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── PERIODIZATION VIEW ── */}
        {section === "period" && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <h1
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "3rem",
                  color: "var(--primary)",
                  lineHeight: 1,
                  letterSpacing: "2px",
                }}
              >
                PERIODIZAÇÃO
              </h1>
              <p
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  color: "var(--muted)",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontSize: "0.9rem",
                  marginTop: "4px",
                }}
              >
                {plan.total_weeks} semanas · {plan.division_type}
              </p>
            </div>

            <div className="scrollable">
              <table className="period-table">
                <thead>
                  <tr>
                    <th>SEMANA</th>
                    <th>VOLUME</th>
                    <th>INTENSIDADE</th>
                    <th>SÉRIES × REPS</th>
                    <th>OBSERVAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {periodWeeks.map((pw) => (
                    <tr
                      key={pw.id}
                      className={
                        pw.week_number === activeWeek ? "period-active" : ""
                      }
                    >
                      <td className="week-col">S{pw.week_number}</td>
                      <td>
                        <span className={volLabelClass(pw.volume_label)}>
                          {pw.volume_label ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span className={intLabelClass(pw.intensity_label)}>
                          {pw.intensity_label ?? "—"}
                        </span>
                      </td>
                      <td>
                        {pw.sets_range} × {pw.reps_range}
                      </td>
                      <td
                        style={{
                          textAlign: "left",
                          fontSize: "0.78rem",
                          color: "var(--muted)",
                        }}
                      >
                        {pw.observation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  Student,
  WorkoutDay,
  Exercise,
  PeriodizationWeek,
  TrainerTheme,
} from "@/lib/types";
import { useWorkoutState } from "@/lib/hooks/useWorkoutState";
import ExerciseSessionCard from "@/components/session/ExerciseSessionCard";

interface Props {
  trainerSlug: string;
  studentSlug: string;
  student: Student;
  day: WorkoutDay;
  exercises: Exercise[];
  periodWeek: PeriodizationWeek | null;
  weekNumber: number;
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

export default function WorkoutSessionClient({
  trainerSlug,
  studentSlug,
  student,
  day,
  exercises,
  periodWeek,
  weekNumber,
  theme,
}: Props) {
  const router = useRouter();
  const exerciseIds = exercises.map((e) => e.id);

  const {
    state,
    setSessionId,
    updateSet,
    addSet,
    removeSet,
    goToExercise,
    markCompleted,
  } = useWorkoutState(student.id, day.id, weekNumber, exerciseIds);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const sessionInitializing = useRef(false);

  // Create session on Supabase if we don't have one yet
  useEffect(() => {
    if (state.session_id || sessionInitializing.current) return;

    sessionInitializing.current = true;
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        workout_day_id: day.id,
        week_number: weekNumber,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setSessionId(data.id);
      })
      .catch(() => {
        // Non-blocking — we still let the user work
        sessionInitializing.current = false;
      });
  }, [state.session_id, student.id, day.id, weekNumber, setSessionId]);

  // Auto-save sets every time state changes (debounced)
  const saveSets = useCallback(async () => {
    if (!state.session_id) return;
    const sets = state.exercises.flatMap((ex) =>
      ex.sets.map((s, si) => ({
        exercise_id: ex.exercise_id,
        set_number: si + 1,
        weight: s.weight !== "" ? parseFloat(s.weight) : null,
        reps: s.reps !== "" ? parseInt(s.reps, 10) : null,
        completed: s.completed,
      })),
    );
    await fetch(`/api/sessions/${state.session_id}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sets }),
    });
  }, [state.session_id, state.exercises]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveSets();
    }, 1500);
    return () => clearTimeout(timer);
  }, [saveSets]);

  async function handleFinish() {
    setSaving(true);
    setSaveError(null);
    try {
      // Final save of sets
      await saveSets();

      if (state.session_id) {
        await fetch(`/api/sessions/${state.session_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      }

      markCompleted();
      router.push(`/${trainerSlug}/${studentSlug}`);
    } catch {
      setSaveError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function getVolume(ex: Exercise): string {
    if (!periodWeek) return "— × —";
    if (ex.type === "cluster" && periodWeek.is_cluster && ex.cluster_block) {
      return `${periodWeek.sets_range} × ${ex.cluster_block}`;
    }
    return `${periodWeek.sets_range} × ${periodWeek.reps_range}`;
  }

  const completedCount = state.exercises.filter((ex) =>
    ex.sets.every((s) => s.completed),
  ).length;
  const totalExercises = exercises.length;
  const allDone = completedCount === totalExercises && totalExercises > 0;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.floor(
    (now - new Date(state.started_at).getTime()) / 1000,
  );
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;

  return (
    <div style={themeVars(theme)}>
      {/* Header */}
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
                {day.label} · Semana {weekNumber}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span className="badge">{student.name}</span>
              <span className="badge">
                {completedCount}/{totalExercises} exercícios
              </span>
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
                  cursor: "pointer",
                }}
              >
                ← Sair
              </a>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              height: "3px",
              background: "var(--border)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0}%`,
                background: "var(--primary)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </header>

      <div
        className="container"
        style={{ paddingTop: "20px", paddingBottom: "100px" }}
      >
        {day.warmup && (
          <div
            style={{
              background: "rgba(232,25,44,0.05)",
              border: "1px solid var(--primary-dim)",
              borderLeft: "3px solid var(--primary)",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "0.82rem",
              color: "var(--muted)",
            }}
          >
            <strong
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--accent)",
                display: "block",
                marginBottom: "3px",
              }}
            >
              ⚡ Aquecimento
            </strong>
            {day.warmup}
          </div>
        )}

        {/* Quick exercise nav */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          {exercises.map((ex, i) => {
            const exState = state.exercises[i];
            const done = exState?.sets.every((s) => s.completed);
            return (
              <button
                key={ex.id}
                onClick={() => goToExercise(i)}
                className={`wk-btn${state.current_exercise_index === i ? " active" : ""}`}
                style={{
                  fontSize: "0.72rem",
                  padding: "3px 9px",
                  opacity: done ? 0.5 : 1,
                  textDecoration: done ? "line-through" : "none",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            );
          })}
        </div>

        {/* Exercise cards */}
        {exercises.map((ex, i) => {
          const exState = state.exercises[i];
          if (!exState) return null;
          return (
            <ExerciseSessionCard
              key={ex.id}
              exercise={ex}
              exerciseIndex={i}
              activeExercise={exState}
              isActive={state.current_exercise_index === i}
              onUpdateSet={updateSet}
              onAddSet={addSet}
              onRemoveSet={removeSet}
              onActivate={() => goToExercise(i)}
              periodVolume={getVolume(ex)}
            />
          );
        })}

        {saveError && (
          <p
            style={{
              color: "var(--primary)",
              marginTop: "12px",
              fontSize: "0.85rem",
            }}
          >
            {saveError}
          </p>
        )}
      </div>

      {/* Sticky footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          zIndex: 100,
        }}
      >
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.75rem",
            color: "var(--muted)",
            letterSpacing: "1px",
          }}
        >
          ⏱ {String(elapsedMin).padStart(2, "0")}:
          {String(elapsedSec).padStart(2, "0")}
        </span>
        <button
          onClick={handleFinish}
          disabled={saving}
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.1rem",
            letterSpacing: "2px",
            background: allDone ? "var(--primary)" : "var(--surface2)",
            color: allDone ? "#fff" : "var(--muted)",
            border: `1px solid ${allDone ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "6px",
            padding: "10px 28px",
            cursor: saving ? "default" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {saving
            ? "Salvando..."
            : allDone
              ? "✓ Finalizar Treino"
              : "Finalizar Treino"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import type { Exercise, ActiveExercise } from "@/lib/types";
import SetInputRow from "./SetInputRow";
import { useRestTimer } from "@/lib/hooks/useRestTimer";
import VideoPlayer from "@/components/session/VideoPlayer";
import { EXERCISE_DEFAULT_VIDEOS } from "@/lib/exercises";

interface Props {
  exercise: Exercise;
  exerciseIndex: number;
  activeExercise: ActiveExercise;
  isActive: boolean;
  onUpdateSet: (
    exerciseIndex: number,
    setIndex: number,
    patch: { weight?: string; reps?: string; completed?: boolean },
  ) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onActivate: () => void;
  periodVolume: string;
}

export default function ExerciseSessionCard({
  exercise,
  exerciseIndex,
  activeExercise,
  isActive,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onActivate,
  periodVolume,
}: Props) {
  const [showVideo, setShowVideo] = useState(false);
  const effectiveVideoUrl =
    exercise.video_url ?? EXERCISE_DEFAULT_VIDEOS[exercise.name];
  const effectiveVideoType = exercise.video_url
    ? exercise.video_type
    : "external";
  const restSeconds = parseRestTime(exercise.rest_time);
  const {
    seconds,
    running,
    formatted,
    start: startTimer,
    stop: stopTimer,
  } = useRestTimer(restSeconds);
  const prevCompletedRef = useRef<boolean[]>([]);

  // Auto-start rest timer when a set is marked completed
  useEffect(() => {
    const current = activeExercise.sets.map((s) => s.completed);
    const prev = prevCompletedRef.current;
    const newlyCompleted = current.some((c, i) => c && !prev[i]);
    if (newlyCompleted && restSeconds > 0) {
      startTimer();
    }
    prevCompletedRef.current = current;
  }, [activeExercise.sets, restSeconds, startTimer]);

  const allSetsCompleted =
    activeExercise.sets.length > 0 &&
    activeExercise.sets.every((s) => s.completed);

  return (
    <div
      onClick={!isActive ? onActivate : undefined}
      style={{
        background: isActive ? "var(--surface)" : "var(--surface2)",
        border: `1px solid ${isActive ? "var(--primary-dim)" : "var(--border)"}`,
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
        cursor: isActive ? "default" : "pointer",
        opacity: allSetsCompleted && !isActive ? 0.55 : 1,
        transition: "opacity 0.2s, border-color 0.2s",
      }}
    >
      {/* Exercise header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: isActive ? "12px" : "0",
          gap: "8px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.65rem",
                color: "var(--muted)",
                fontWeight: 700,
              }}
            >
              {String(exerciseIndex + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.25rem",
                color: allSetsCompleted ? "var(--muted)" : "var(--text)",
                letterSpacing: "1px",
              }}
            >
              {allSetsCompleted ? "✓ " : ""}
              {exercise.name}
            </span>
            {exercise.type === "compound" && (
              <span className="ex-tag">Composto</span>
            )}
            {exercise.type === "cluster" && (
              <span className="ex-tag ex-tag-cluster">Cluster</span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "4px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span className="vol-chip">{periodVolume}</span>
            {exercise.rest_time && (
              <span className="rest-chip">{exercise.rest_time}</span>
            )}
            {effectiveVideoUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo((v) => !v);
                }}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.7rem",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: showVideo ? "var(--primary)" : "var(--muted)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                {showVideo ? "▼ Vídeo" : "▶ Vídeo"}
              </button>
            )}
          </div>
          {exercise.notes && isActive && (
            <div className="ex-note" style={{ marginTop: "6px" }}>
              {exercise.notes}
            </div>
          )}
        </div>
      </div>

      {/* Video player */}
      {showVideo && effectiveVideoUrl && (
        <div style={{ marginBottom: "12px" }}>
          <VideoPlayer url={effectiveVideoUrl} type={effectiveVideoType} />
        </div>
      )}

      {/* Set rows — only shown when active */}
      {isActive && (
        <>
          <div style={{ marginBottom: "8px" }}>
            {activeExercise.sets.map((set, si) => (
              <SetInputRow
                key={si}
                setIndex={si}
                set={set}
                onChange={(patch) => onUpdateSet(exerciseIndex, si, patch)}
                onRemove={() => onRemoveSet(exerciseIndex, si)}
                canRemove={activeExercise.sets.length > 1}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: "10px",
            }}
          >
            <button
              onClick={() => onAddSet(exerciseIndex)}
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
              + Série
            </button>

            {/* Rest timer */}
            {restSeconds > 0 && (
              <div style={{ flex: 1, minWidth: "180px" }}>
                {running || seconds > 0 ? (
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
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
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
                        onClick={stopTimer}
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: "0.7rem",
                          color: "var(--muted)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          textDecoration: "underline",
                          textAlign: "left",
                        }}
                      >
                        Pular
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startTimer()}
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
                    ▶ Descanso ({Math.floor(restSeconds / 60)}:
                    {String(restSeconds % 60).padStart(2, "0")})
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Convert "2min", "90s", "1:30", "2 min" → seconds. Defaults to 90s. */
function parseRestTime(rest: string | null): number {
  if (!rest) return 0;
  const lower = rest.toLowerCase().replace(/\s/g, "");
  const mmss = lower.match(/^(\d+):(\d{2})$/);
  if (mmss) return parseInt(mmss[1]) * 60 + parseInt(mmss[2]);
  const mins = lower.match(/^(\d+)(?:min|m)$/);
  if (mins) return parseInt(mins[1]) * 60;
  const secs = lower.match(/^(\d+)s(?:eg)?$/);
  if (secs) return parseInt(secs[1]);
  const num = lower.match(/^(\d+)$/);
  if (num) return parseInt(num[1]); // bare number treated as seconds
  return 0;
}

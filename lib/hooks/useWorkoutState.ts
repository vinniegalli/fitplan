"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkoutState, ActiveSet } from "@/lib/types";

const KEY = (studentId: string, dayId: string) =>
  `fitplan_workout_${studentId}_${dayId}`;

export function useWorkoutState(
  studentId: string,
  dayId: string,
  weekNumber: number,
  exerciseIds: string[],
) {
  const storageKey = KEY(studentId, dayId);

  const buildInitial = useCallback(
    (): WorkoutState => ({
      session_id: null,
      student_id: studentId,
      workout_day_id: dayId,
      week_number: weekNumber,
      started_at: new Date().toISOString(),
      exercises: exerciseIds.map((id) => ({
        exercise_id: id,
        sets: [{ weight: "", reps: "", completed: false }],
      })),
      current_exercise_index: 0,
      completed: false,
    }),
    [studentId, dayId, weekNumber, exerciseIds],
  );

  const [state, setState] = useState<WorkoutState>(() => {
    if (typeof window === "undefined") return buildInitial();
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: WorkoutState = JSON.parse(saved);
        // Only restore if same week and not completed
        if (
          parsed.week_number === weekNumber &&
          parsed.workout_day_id === dayId &&
          !parsed.completed
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    return buildInitial();
  });

  // Persist to localStorage on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // quota exceeded — not critical
    }
  }, [state, storageKey]);

  const setSessionId = useCallback((id: string) => {
    setState((s) => ({ ...s, session_id: id }));
  }, []);

  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, patch: Partial<ActiveSet>) => {
      setState((s) => {
        const exercises = s.exercises.map((ex, ei) => {
          if (ei !== exerciseIndex) return ex;
          return {
            ...ex,
            sets: ex.sets.map((st, si) =>
              si === setIndex ? { ...st, ...patch } : st,
            ),
          };
        });
        return { ...s, exercises };
      });
    },
    [],
  );

  const addSet = useCallback((exerciseIndex: number) => {
    setState((s) => {
      const exercises = s.exercises.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        // Copy last set's weight as default for new set
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { weight: last?.weight ?? "", reps: "", completed: false },
          ],
        };
      });
      return { ...s, exercises };
    });
  }, []);

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setState((s) => {
      const exercises = s.exercises.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        if (ex.sets.length <= 1) return ex; // keep at least 1 set
        return { ...ex, sets: ex.sets.filter((_, si) => si !== setIndex) };
      });
      return { ...s, exercises };
    });
  }, []);

  const goToExercise = useCallback((index: number) => {
    setState((s) => ({ ...s, current_exercise_index: index }));
  }, []);

  const markCompleted = useCallback(() => {
    setState((s) => ({ ...s, completed: true }));
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    state,
    setSessionId,
    updateSet,
    addSet,
    removeSet,
    goToExercise,
    markCompleted,
  };
}

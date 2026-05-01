"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useRestTimer(defaultSeconds: number) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clear();
    setRunning(false);
    setSeconds(0);
  }, [clear]);

  const start = useCallback(
    (overrideSeconds?: number) => {
      clear();
      const duration = overrideSeconds ?? defaultSeconds;
      setSeconds(duration);
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clear();
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clear, defaultSeconds],
  );

  // Cleanup on unmount
  useEffect(() => () => clear(), [clear]);

  const formatted = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return { seconds, running, formatted, start, stop };
}

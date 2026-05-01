"use client";

import type { ActiveSet } from "@/lib/types";

interface Props {
  setIndex: number;
  set: ActiveSet;
  onChange: (patch: Partial<ActiveSet>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function SetInputRow({
  setIndex,
  set,
  onChange,
  onRemove,
  canRemove,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr 1fr auto",
        gap: "8px",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "0.75rem",
          color: "var(--muted)",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {setIndex + 1}
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <label
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Carga (kg)
        </label>
        <input
          type="number"
          min={0}
          step={0.5}
          inputMode="decimal"
          value={set.weight}
          onChange={(e) => onChange({ weight: e.target.value })}
          placeholder="—"
          style={{
            background: "var(--surface2)",
            border: `1px solid ${set.completed ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "4px",
            color: "var(--text)",
            padding: "6px 8px",
            fontSize: "1rem",
            fontWeight: 700,
            width: "100%",
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <label
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Reps
        </label>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={set.reps}
          onChange={(e) => onChange({ reps: e.target.value })}
          placeholder="—"
          style={{
            background: "var(--surface2)",
            border: `1px solid ${set.completed ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "4px",
            color: "var(--text)",
            padding: "6px 8px",
            fontSize: "1rem",
            fontWeight: 700,
            width: "100%",
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <button
          onClick={() => onChange({ completed: !set.completed })}
          title={set.completed ? "Marcar incompleto" : "Confirmar série"}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            border: `2px solid ${set.completed ? "var(--primary)" : "var(--border)"}`,
            background: set.completed ? "var(--primary)" : "transparent",
            color: set.completed ? "#fff" : "var(--muted)",
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ✓
        </button>
        {canRemove && (
          <button
            onClick={onRemove}
            title="Remover série"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--muted)",
              fontSize: "0.75rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

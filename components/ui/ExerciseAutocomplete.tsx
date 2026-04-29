import { useState, useRef, useEffect } from "react";
import { EXERCISE_LIST } from "@/lib/exercises";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function ExerciseAutocomplete({
  value,
  onChange,
  placeholder,
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered =
    value.trim().length === 0
      ? EXERCISE_LIST
      : EXERCISE_LIST.filter((e) =>
          e.toLowerCase().includes(value.toLowerCase()),
        );

  const hasExactMatch = EXERCISE_LIST.some(
    (e) => e.toLowerCase() === value.trim().toLowerCase(),
  );
  const showCustomOption = value.trim().length > 0 && !hasExactMatch;
  const showDropdown = open && (filtered.length > 0 || showCustomOption);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setOpen(true);
  }

  function handleSelect(name: string) {
    onChange(name);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Ex: Supino Inclinado com Halteres"}
        required={required}
        autoComplete="off"
      />
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--primary-dim)",
            borderRadius: "2px",
            zIndex: 50,
            maxHeight: "240px",
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={() => handleSelect(name)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                padding: "9px 12px",
                fontSize: "0.85rem",
                color: "var(--text)",
                cursor: "pointer",
                borderBottom: "1px solid var(--border)",
                fontFamily: "'Barlow', sans-serif",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {name}
            </button>
          ))}
          {value.trim().length > 0 &&
            !EXERCISE_LIST.some(
              (e) => e.toLowerCase() === value.toLowerCase(),
            ) && (
              <button
                type="button"
                onMouseDown={() => handleSelect(value.trim())}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: "9px 12px",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontFamily: "'Barlow', sans-serif",
                  fontStyle: "italic",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--surface2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                + Usar &quot;{value.trim()}&quot; como exercício personalizado
              </button>
            )}
        </div>
      )}
    </div>
  );
}

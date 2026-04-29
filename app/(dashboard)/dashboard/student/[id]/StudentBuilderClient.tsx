"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type {
  Trainer,
  Student,
  TrainingPlan,
  WorkoutDay,
  Exercise,
  PeriodizationWeek,
} from "@/lib/types";
import { DIVISION_TEMPLATES, DEFAULT_PERIODIZATION } from "@/lib/types";
import ExerciseAutocomplete from "@/components/ui/ExerciseAutocomplete";

interface Props {
  trainer: Trainer;
  student: Student;
  initialPlan: TrainingPlan | null;
  initialDays: WorkoutDay[];
  initialExercises: Record<string, Exercise[]>;
  initialPeriodization: PeriodizationWeek[];
}

type Tab = "treino" | "periodizacao";

export default function StudentBuilderClient({
  trainer,
  student,
  initialPlan,
  initialDays,
  initialExercises,
  initialPeriodization,
}: Props) {
  const supabase = createClient();

  const [plan, setPlan] = useState<TrainingPlan | null>(initialPlan);
  const [days, setDays] = useState<WorkoutDay[]>(initialDays);
  const [exercises, setExercises] =
    useState<Record<string, Exercise[]>>(initialExercises);
  const [periods, setPeriods] =
    useState<PeriodizationWeek[]>(initialPeriodization);
  const [tab, setTab] = useState<Tab>("treino");
  const [activeDay, setActiveDay] = useState<string | null>(
    initialDays[0]?.id ?? null,
  );

  const [showPlanSetup, setShowPlanSetup] = useState(!initialPlan);
  const [divisionType, setDivisionType] = useState("PPL");
  const [totalWeeks, setTotalWeeks] = useState(12);
  const [creatingPlan, setCreatingPlan] = useState(false);

  const [addExName, setAddExName] = useState("");
  const [addExType, setAddExType] = useState<Exercise["type"] | "">("isolation");
  const [addExBlock, setAddExBlock] = useState("");
  const [addExRest, setAddExRest] = useState("2 min");
  const [addExNotes, setAddExNotes] = useState("");
  const [savingEx, setSavingEx] = useState(false);

  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [periodForm, setPeriodForm] = useState<Partial<PeriodizationWeek>>({});

  // Editing day label/focus
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [dayEditLabel, setDayEditLabel] = useState('');
  const [dayEditFocus, setDayEditFocus] = useState('');

  const template = DIVISION_TEMPLATES.find((t) => t.type === divisionType);
  const currentDayExercises = activeDay ? (exercises[activeDay] ?? []) : [];
  const currentDay = days.find((d) => d.id === activeDay);

  // ── Create Plan ──────────────────────────────────────────────
  async function handleCreatePlan() {
    setCreatingPlan(true);
    const tpl = DIVISION_TEMPLATES.find((t) => t.type === divisionType);

    const { data: newPlan, error } = await supabase
      .from("training_plans")
      .insert({
        student_id: student.id,
        trainer_id: trainer.id,
        division_type: divisionType,
        total_weeks: totalWeeks,
        sessions_per_week: tpl?.sessions ?? null,
        active: true,
      })
      .select()
      .single();

    if (error || !newPlan) {
      setCreatingPlan(false);
      return;
    }

    // Create workout days from template
    const dayRows =
      tpl && tpl.type !== "Custom"
        ? tpl.days.map((d, i) => ({
            plan_id: newPlan.id,
            day_code: d.code,
            label: d.label,
            focus: d.focus,
            warmup: "",
            day_order: i,
          }))
        : [
            {
              plan_id: newPlan.id,
              day_code: "A",
              label: "Treino A",
              focus: "",
              warmup: "",
              day_order: 0,
            },
          ];

    const { data: newDays } = await supabase
      .from("workout_days")
      .insert(dayRows)
      .select();

    // Create default periodization
    const weekRows = DEFAULT_PERIODIZATION(totalWeeks).map((w) => ({
      ...w,
      plan_id: newPlan.id,
    }));
    const { data: newWeeks } = await supabase
      .from("periodization_weeks")
      .insert(weekRows)
      .select();

    setPlan(newPlan);
    setDays(newDays ?? []);
    setActiveDay((newDays ?? [])[0]?.id ?? null);
    setPeriods(newWeeks ?? []);
    setExercises({});
    setShowPlanSetup(false);
    setCreatingPlan(false);
  }

  // ── Add Exercise ─────────────────────────────────────────────
  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDay || !addExName.trim()) return;
    setSavingEx(true);

    const order = currentDayExercises.length;
    const { data: newEx } = await supabase
      .from("exercises")
      .insert({
        workout_day_id: activeDay,
        name: addExName.trim(),
        type: (addExType || "isolation") as Exercise["type"],
        cluster_block: (addExType || "isolation") === "cluster" ? addExBlock || "(3×3)" : null,
        rest_time: addExRest || null,
        notes: addExNotes || null,
        exercise_order: order,
      })
      .select()
      .single();

    if (newEx) {
      setExercises((prev) => ({
        ...prev,
        [activeDay]: [...(prev[activeDay] ?? []), newEx],
      }));
      setAddExName("");
      setAddExBlock("");
      setAddExNotes("");
      setAddExType("isolation");
      setAddExRest("2 min");
    }
    setSavingEx(false);
  }

  async function handleDeleteExercise(dayId: string, exId: string) {
    await supabase.from("exercises").delete().eq("id", exId);
    setExercises((prev) => ({
      ...prev,
      [dayId]: prev[dayId].filter((ex) => ex.id !== exId),
    }));
  }

  // ── Edit Periodization week ───────────────────────────────────
  async function savePeriodWeek(weekId: string) {
    const { data: updated } = await supabase
      .from("periodization_weeks")
      .update(periodForm)
      .eq("id", weekId)
      .select()
      .single();
    if (updated) {
      setPeriods((prev) => prev.map((p) => (p.id === weekId ? updated : p)));
    }
    setEditingPeriod(null);
  }

  // ── Update day warmup ─────────────────────────────────────────
  async function updateWarmup(dayId: string, warmup: string) {
    await supabase.from("workout_days").update({ warmup }).eq("id", dayId);
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, warmup } : d)));
  }

  // ── Update day label/focus ────────────────────────────────────
  async function saveDayEdit(dayId: string) {
    const updates = { label: dayEditLabel, focus: dayEditFocus };
    await supabase.from("workout_days").update(updates).eq("id", dayId);
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, ...updates } : d)));
    setEditingDayId(null);
  }

  const publicUrl = `/${trainer.slug}/${student.slug}`;

  // ── PLAN SETUP SCREEN ─────────────────────────────────────────
  if (showPlanSetup) {
    return (
      <>
        <header className="site-header">
          <div className="site-header-inner">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link href="/dashboard" className="btn btn-ghost btn-sm">
                ← Dashboard
              </Link>
              <div className="logo">
                FIT<span>PLAN</span>
              </div>
            </div>
            <span className="badge">{student.name}</span>
          </div>
        </header>
        <div className="container" style={{ maxWidth: "560px" }}>
          <div className="section-label" style={{ marginTop: "8px" }}>
            Configurar Plano de Treino
          </div>
          <div
            className="card card-red-top"
            style={{
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div className="form-group">
              <label className="form-label">Divisão de treino</label>
              <select
                value={divisionType}
                onChange={(e) => setDivisionType(e.target.value)}
              >
                {DIVISION_TEMPLATES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
              {template && template.type !== "Custom" && (
                <span className="form-hint">
                  {template.sessions} sessões/semana ·{" "}
                  {template.days.map((d) => d.label).join(", ")}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Total de semanas</label>
              <input
                type="number"
                min="4"
                max="52"
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(parseInt(e.target.value))}
              />
              <span className="form-hint">
                A periodização padrão será criada automaticamente
              </span>
            </div>

            <button
              className="btn btn-primary"
              style={{ justifyContent: "center", marginTop: "4px" }}
              onClick={handleCreatePlan}
              disabled={creatingPlan}
            >
              {creatingPlan ? "Criando..." : "Criar Plano de Treino"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── MAIN BUILDER ──────────────────────────────────────────────
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              ← Dashboard
            </Link>
            <div className="logo" style={{ fontSize: "1.4rem" }}>
              FIT<span>PLAN</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span className="badge">{student.name}</span>
            {plan && (
              <span className="badge badge-blue">
                {plan.division_type} · {plan.total_weeks}sem
              </span>
            )}
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
            >
              Ver como aluno ↗
            </a>
          </div>
        </div>
      </header>

      <div className="container-wide">
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "20px",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "0",
          }}
        >
          {(["treino", "periodizacao"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  tab === t
                    ? "2px solid var(--primary)"
                    : "2px solid transparent",
                color: tab === t ? "var(--text)" : "var(--muted)",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                padding: "10px 16px",
                cursor: "pointer",
                transition: "all 0.15s",
                marginBottom: "-1px",
              }}
            >
              {t === "treino" ? "Exercícios" : "Periodização"}
            </button>
          ))}
        </div>

        {/* ── TREINO TAB ── */}
        {tab === "treino" && (
          <div className="day-layout">
            {/* Day sidebar (desktop) */}
            <div className="day-sidebar" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div className="section-label" style={{ margin: "0 0 8px" }}>Dias</div>
              {days.map((d) => (
                <div key={d.id}>
                  {editingDayId === d.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "8px", background: "var(--surface2)", border: "1px solid var(--primary-dim)", borderRadius: "2px" }}>
                      <input
                        value={dayEditLabel}
                        onChange={e => setDayEditLabel(e.target.value)}
                        placeholder="Nome do dia"
                        style={{ fontSize: "0.8rem" }}
                      />
                      <input
                        value={dayEditFocus}
                        onChange={e => setDayEditFocus(e.target.value)}
                        placeholder="Foco muscular"
                        style={{ fontSize: "0.8rem" }}
                      />
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => saveDayEdit(d.id)}>Salvar</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingDayId(null)}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveDay(d.id)}
                      style={{
                        width: "100%",
                        background: activeDay === d.id ? "rgba(232,25,44,0.1)" : "var(--surface)",
                        border: `1px solid ${activeDay === d.id ? "var(--primary-dim)" : "var(--border)"}`,
                        borderLeft: activeDay === d.id ? "3px solid var(--primary)" : "3px solid transparent",
                        color: activeDay === d.id ? "var(--text)" : "var(--muted)",
                        textAlign: "left",
                        padding: "10px 12px",
                        cursor: "pointer",
                        borderRadius: "2px",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        letterSpacing: "1px",
                        transition: "all 0.12s",
                        position: "relative",
                      }}
                    >
                      <div style={{ paddingRight: "20px" }}>{d.label}</div>
                      {d.focus && (
                        <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 400, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {d.focus}
                        </div>
                      )}
                      <div style={{ fontSize: "0.68rem", color: "var(--primary)", marginTop: "4px" }}>
                        {(exercises[d.id] ?? []).length} ex.
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setEditingDayId(d.id); setDayEditLabel(d.label); setDayEditFocus(d.focus ?? ""); }}
                        title="Editar dia"
                        style={{ position: "absolute", top: "6px", right: "6px", background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.7rem", padding: "2px" }}
                      >
                        ✏️
                      </button>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Exercise panel */}
            <div>
              {/* Mobile day select */}
              <div style={{ marginBottom: "14px", display: "none" }} className="mobile-day-select">
                <label className="form-label" style={{ marginBottom: "6px" }}>Dia de treino</label>
                <select value={activeDay ?? ""} onChange={e => setActiveDay(e.target.value)}>
                  {days.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.label}{d.focus ? ` — ${d.focus}` : ""} ({(exercises[d.id] ?? []).length} ex.)
                    </option>
                  ))}
                </select>
              </div>

              {currentDay && (
                <>
                  <div style={{ marginBottom: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div>
                      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color: "var(--primary)", letterSpacing: "2px", lineHeight: 1 }}>
                        {currentDay.label}
                      </h2>
                      {currentDay.focus && <p className="text-muted text-sm">{currentDay.focus}</p>}
                    </div>
                  </div>

                  {/* Warmup */}
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label className="form-label">⚡ Aquecimento</label>
                    <textarea
                      rows={2}
                      defaultValue={currentDay.warmup ?? ""}
                      onBlur={(e) =>
                        updateWarmup(currentDay.id, e.target.value)
                      }
                      placeholder="Descreva o protocolo de aquecimento..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Exercises table */}
                  <div className="scrollable" style={{ marginBottom: "20px" }}>
                    <table className="exercise-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Exercício</th>
                          <th>Tipo</th>
                          <th>Descanso</th>
                          <th>Notas</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDayExercises.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              style={{
                                textAlign: "center",
                                color: "var(--muted)",
                                padding: "24px",
                              }}
                            >
                              Nenhum exercício. Adicione abaixo.
                            </td>
                          </tr>
                        ) : (
                          currentDayExercises.map((ex, i) => (
                            <tr key={ex.id}>
                              <td className="ex-num">
                                {String(i + 1).padStart(2, "0")}
                              </td>
                              <td>
                                <span className="ex-name">{ex.name}</span>
                                {ex.type === "compound" && (
                                  <span className="ex-tag">Composto</span>
                                )}
                                {ex.type === "cluster" && (
                                  <span className="ex-tag ex-tag-cluster">
                                    Cluster
                                  </span>
                                )}
                                {ex.cluster_block && (
                                  <span
                                    className="text-muted text-xs"
                                    style={{ marginLeft: "6px" }}
                                  >
                                    {ex.cluster_block}
                                  </span>
                                )}
                                {ex.notes && (
                                  <div className="ex-note">{ex.notes}</div>
                                )}
                              </td>
                              <td>
                                <span className="badge">
                                  {
                                    {
                                      compound: "Composto",
                                      cluster: "Cluster",
                                      isolation: "Isolamento",
                                    }[ex.type]
                                  }
                                </span>
                              </td>
                              <td>
                                <span className="rest-chip">
                                  {ex.rest_time ?? "—"}
                                </span>
                              </td>
                              <td style={{ maxWidth: "180px" }}>
                                <span className="ex-note">
                                  {ex.notes ?? ""}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{
                                    color: "var(--muted)",
                                    padding: "4px 8px",
                                  }}
                                  onClick={() =>
                                    handleDeleteExercise(currentDay.id, ex.id)
                                  }
                                  title="Remover"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add exercise form */}
                  <div
                    className="card card-red-top"
                    style={{ padding: "16px" }}
                  >
                    <div
                      className="section-label"
                      style={{ margin: "0 0 12px" }}
                    >
                      Adicionar Exercício
                    </div>
                    <form
                      onSubmit={handleAddExercise}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Nome do exercício *</label>
                          <ExerciseAutocomplete
                            value={addExName}
                            onChange={setAddExName}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Tipo</label>
                          <select
                            value={addExType}
                            onChange={(e) =>
                              setAddExType(e.target.value as Exercise["type"] | "")
                            }
                          >
                            <option value="">— Tipo —</option>
                            <option value="compound">Composto</option>
                            <option value="cluster">Cluster</option>
                            <option value="isolation">Isolamento</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-grid-2">
                        {(addExType === "cluster") && (
                          <div className="form-group">
                            <label className="form-label">Bloco Cluster</label>
                            <input
                              value={addExBlock}
                              onChange={(e) => setAddExBlock(e.target.value)}
                              placeholder="(3×3)"
                            />
                          </div>
                        )}
                        <div className="form-group">
                          <label className="form-label">Descanso</label>
                          <input
                            value={addExRest}
                            onChange={(e) => setAddExRest(e.target.value)}
                            placeholder="2 min"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Notas</label>
                        <input
                          value={addExNotes}
                          onChange={(e) => setAddExNotes(e.target.value)}
                          placeholder="Amplitude completa, RIR 1–2..."
                        />
                      </div>
                      <div
                        style={{ display: "flex", justifyContent: "flex-end" }}
                      >
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={savingEx}
                        >
                          {savingEx ? "Adicionando..." : "+ Adicionar"}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── PERIODIZAÇÃO TAB ── */}
        {tab === "periodizacao" && (
          <div>
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <p className="text-muted text-sm">
                Clique em uma linha para editar. Volumes são aplicados aos
                exercícios Compostos e Cluster na página do aluno.
              </p>
            </div>

            <div className="scrollable">
              <table className="period-table">
                <thead>
                  <tr>
                    <th>SEM</th>
                    <th>VOLUME</th>
                    <th>INTENSIDADE</th>
                    <th>SÉRIES</th>
                    <th>REPS</th>
                    <th>CLUSTER</th>
                    <th>OBSERVAÇÃO</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((pw) => (
                    <tr
                      key={pw.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        if (editingPeriod === pw.id) return;
                        setEditingPeriod(pw.id);
                        setPeriodForm({ ...pw });
                      }}
                    >
                      <td className="week-col">S{pw.week_number}</td>
                      {editingPeriod === pw.id ? (
                        <>
                          <td>
                            <select
                              value={periodForm.volume_label ?? ""}
                              onChange={(e) =>
                                setPeriodForm((p) => ({
                                  ...p,
                                  volume_label: e.target.value,
                                }))
                              }
                              style={{ minWidth: "80px" }}
                            >
                              {[
                                "Deload",
                                "Baixo",
                                "Médio",
                                "Médio-Alto",
                                "Alto",
                                "Super Alto",
                              ].map((v) => (
                                <option key={v}>{v}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              value={periodForm.intensity_label ?? ""}
                              onChange={(e) =>
                                setPeriodForm((p) => ({
                                  ...p,
                                  intensity_label: e.target.value,
                                }))
                              }
                              style={{ minWidth: "70px" }}
                            >
                              {["Baixa", "Média", "Alta"].map((v) => (
                                <option key={v}>{v}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              value={periodForm.sets_range ?? ""}
                              onChange={(e) =>
                                setPeriodForm((p) => ({
                                  ...p,
                                  sets_range: e.target.value,
                                }))
                              }
                              style={{ width: "60px" }}
                            />
                          </td>
                          <td>
                            <input
                              value={periodForm.reps_range ?? ""}
                              onChange={(e) =>
                                setPeriodForm((p) => ({
                                  ...p,
                                  reps_range: e.target.value,
                                }))
                              }
                              style={{ width: "70px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={periodForm.is_cluster ?? false}
                              onChange={(e) =>
                                setPeriodForm((p) => ({
                                  ...p,
                                  is_cluster: e.target.checked,
                                }))
                              }
                              style={{ width: "auto", cursor: "pointer" }}
                            />
                          </td>
                          <td>
                            <input
                              value={periodForm.observation ?? ""}
                              onChange={(e) =>
                                setPeriodForm((p) => ({
                                  ...p,
                                  observation: e.target.value,
                                }))
                              }
                              style={{ minWidth: "160px" }}
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => savePeriodWeek(pw.id)}
                            >
                              ✓
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span
                              className={
                                pw.volume_label
                                  ?.toLowerCase()
                                  .includes("deload")
                                  ? "pill pill-deload"
                                  : pw.volume_label
                                        ?.toLowerCase()
                                        .includes("alto")
                                    ? "pill pill-alto"
                                    : pw.volume_label
                                          ?.toLowerCase()
                                          .includes("médio")
                                      ? "pill pill-medio"
                                      : "pill pill-baixo"
                              }
                            >
                              {pw.volume_label ?? "—"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={
                                pw.intensity_label === "Alta"
                                  ? "pill pill-alto"
                                  : pw.intensity_label === "Média"
                                    ? "pill pill-medio"
                                    : "pill pill-baixo"
                              }
                            >
                              {pw.intensity_label ?? "—"}
                            </span>
                          </td>
                          <td>{pw.sets_range}</td>
                          <td>{pw.reps_range}</td>
                          <td>
                            {pw.is_cluster ? (
                              <span className="badge badge-blue">Sim</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "left",
                              maxWidth: "200px",
                              fontSize: "0.78rem",
                              color: "var(--muted)",
                            }}
                          >
                            {pw.observation}
                          </td>
                          <td>
                            <span className="text-xs text-muted">editar</span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

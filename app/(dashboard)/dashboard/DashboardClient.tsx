"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Trainer, Student } from "@/lib/types";

interface StudentWithPlan extends Student {
  training_plans: {
    id: string;
    division_type: string;
    total_weeks: number;
    active: boolean;
  }[];
}

interface Props {
  trainer: Trainer;
  initialStudents: StudentWithPlan[];
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function DashboardClient({ trainer, initialStudents }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [students, setStudents] = useState(initialStudents);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    goal: "",
    level: "intermediário" as Student["level"],
  });

  const FREE_LIMIT = 3;
  const isFreeLimited =
    trainer.plan === "free" && students.length >= FREE_LIMIT;

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    setSaving(true);

    const baseSlug = slugify(form.name);
    const { data: newStudent, error: insertError } = await supabase
      .from("students")
      .insert({
        trainer_id: trainer.id,
        name: form.name.trim(),
        slug: baseSlug,
        age: form.age ? parseInt(form.age) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        goal: form.goal || null,
        level: form.level || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setStudents((prev) => [{ ...newStudent, training_plans: [] }, ...prev]);
    setShowModal(false);
    setForm({
      name: "",
      age: "",
      weight: "",
      height: "",
      goal: "",
      level: "intermediário",
    });
    setSaving(false);
    router.push(`/dashboard/student/${newStudent.id}`);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleDeleteStudent(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) setStudents((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <>
      {/* Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <div className="logo">
            FIT<span>PLAN</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span className="badge">{trainer.name}</span>
            <span
              className={`badge ${trainer.plan === "pro" ? "badge-red" : ""}`}
            >
              {trainer.plan === "pro" ? "PRO" : "Gratuito"}
            </span>
            <Link href="/settings" className="btn btn-outline btn-sm">
              Configurações
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "2.2rem",
                color: "var(--primary)",
                letterSpacing: "2px",
                lineHeight: 1,
              }}
            >
              ALUNOS
            </h1>
            <p className="text-muted text-sm" style={{ marginTop: "4px" }}>
              {students.length} aluno{students.length !== 1 ? "s" : ""}
              {trainer.plan === "free" &&
                ` · plano gratuito (${students.length}/${FREE_LIMIT})`}
            </p>
          </div>

          {isFreeLimited ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="badge badge-red">Limite atingido</span>
              <Link
                href="/settings#upgrade"
                className="btn btn-primary btn-sm"
              >
                Fazer upgrade
              </Link>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowModal(true);
                setError("");
              }}
            >
              + Novo Aluno
            </button>
          )}
        </div>

        {/* Student grid */}
        {students.length === 0 ? (
          <div
            className="card"
            style={{ padding: "48px", textAlign: "center" }}
          >
            <p
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.4rem",
                color: "var(--muted)",
                letterSpacing: "2px",
              }}
            >
              Nenhum aluno ainda
            </p>
            <p className="text-muted text-sm" style={{ marginTop: "8px" }}>
              Clique em &ldquo;+ Novo Aluno&rdquo; para começar.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {students.map((s) => {
              const activePlan = s.training_plans?.find((p) => p.active);
              return (
                <div key={s.id} style={{ position: "relative" }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteStudent(s.id, s.name);
                    }}
                    title="Excluir aluno"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      zIndex: 1,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      fontSize: "0.85rem",
                      padding: "4px 6px",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                  <Link
                    key={s.id}
                    href={`/dashboard/student/${s.id}`}
                    style={{ display: "block" }}
                  >
                    <div
                      className="card card-red-top"
                      style={{
                        padding: "18px",
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 700,
                            fontSize: "1.05rem",
                            color: "var(--text)",
                            paddingRight: "24px",
                          }}
                        >
                          {s.name}
                        </span>
                        <span
                          className={`badge ${s.active ? "badge-green" : ""}`}
                        >
                          {s.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      {(s.age || s.weight || s.level) && (
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginBottom: "10px",
                          }}
                        >
                          {s.age && <span className="badge">{s.age} anos</span>}
                          {s.weight && (
                            <span className="badge">{s.weight}kg</span>
                          )}
                          {s.level && <span className="badge">{s.level}</span>}
                        </div>
                      )}

                      {activePlan ? (
                        <div
                          style={{
                            borderTop: "1px solid var(--border)",
                            paddingTop: "10px",
                            marginTop: "4px",
                          }}
                        >
                          <span className="badge badge-blue">
                            {activePlan.division_type}
                          </span>
                          <span
                            className="text-muted text-xs"
                            style={{ marginLeft: "6px" }}
                          >
                            {activePlan.total_weeks} semanas
                          </span>
                        </div>
                      ) : (
                        <p
                          className="text-muted text-xs"
                          style={{
                            borderTop: "1px solid var(--border)",
                            paddingTop: "10px",
                          }}
                        >
                          Sem plano de treino
                        </p>
                      )}

                      <p
                        className="text-xs"
                        style={{ marginTop: "8px", color: "var(--primary)" }}
                      >
                        /{trainer.slug}/{s.slug}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Student Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-title">Novo Aluno</div>

            <form
              onSubmit={handleCreate}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Maria Silva"
                  required
                />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Idade</label>
                  <input
                    name="age"
                    type="number"
                    min="10"
                    max="99"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="28"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Peso (kg)</label>
                  <input
                    name="weight"
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    value={form.weight}
                    onChange={handleChange}
                    placeholder="70.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Altura (m)</label>
                  <input
                    name="height"
                    type="number"
                    step="0.01"
                    min="1.2"
                    max="2.5"
                    value={form.height}
                    onChange={handleChange}
                    placeholder="1.70"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nível</label>
                <select
                  name="level"
                  value={form.level ?? ""}
                  onChange={handleChange}
                >
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediário">Intermediário</option>
                  <option value="avançado">Avançado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Objetivo</label>
                <input
                  name="goal"
                  value={form.goal}
                  onChange={handleChange}
                  placeholder="Hipertrofia + Fat Loss"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Criar Aluno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

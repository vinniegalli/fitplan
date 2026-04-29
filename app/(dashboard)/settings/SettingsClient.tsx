"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Trainer, TrainerTheme } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/types";

const COLOR_FIELDS: { key: keyof TrainerTheme; label: string; hint: string }[] =
  [
    {
      key: "primary",
      label: "Cor primária",
      hint: "Bordas, botões, destaques principais",
    },
    {
      key: "primaryDim",
      label: "Primária escura",
      hint: "Versão escura da cor primária",
    },
    { key: "accent", label: "Destaque", hint: "Textos e badges de destaque" },
    { key: "bg", label: "Fundo", hint: "Fundo geral da página" },
    { key: "surface", label: "Superfície", hint: "Cards e containers" },
    {
      key: "surface2",
      label: "Superfície 2",
      hint: "Headers de tabela e elementos secundários",
    },
    { key: "border", label: "Borda", hint: "Bordas e divisores" },
    { key: "text", label: "Texto", hint: "Texto principal" },
    { key: "muted", label: "Texto muted", hint: "Labels e texto secundário" },
  ];

interface Props {
  trainer: Trainer;
}

export default function SettingsClient({ trainer }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const isPro = trainer.plan === "pro";
  const [theme, setTheme] = useState<TrainerTheme>({
    ...DEFAULT_THEME,
    ...(trainer.theme ?? {}),
  });
  const [name, setName] = useState(trainer.name);
  const [saving, setSaving] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [msg, setMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("trainers").update({ name }).eq("id", trainer.id);
    setMsg("Nome atualizado!");
    setSaving(false);
    router.refresh();
  }

  async function handleSaveTheme() {
    if (!isPro) return;
    setSavingTheme(true);
    await supabase.from("trainers").update({ theme }).eq("id", trainer.id);
    setMsg("Tema salvo!");
    setSavingTheme(false);
    router.refresh();
  }

  function resetTheme() {
    setTheme({ ...DEFAULT_THEME });
  }

  const previewVars = {
    "--primary": theme.primary,
    "--primary-dim": theme.primaryDim,
    "--bg": theme.bg,
    "--surface": theme.surface,
    "--surface2": theme.surface2,
    "--border": theme.border,
    "--text": theme.text,
    "--muted": theme.muted,
    "--accent": theme.accent,
  } as React.CSSProperties;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "As senhas não coincidem." });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMsg({
        type: "error",
        text: "A nova senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }
    setSavingPwd(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });
    if (signInError) {
      setPwdMsg({ type: "error", text: "Senha atual incorreta." });
      setSavingPwd(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwdMsg({ type: "error", text: error.message });
    } else {
      setPwdMsg({ type: "success", text: "Senha alterada com sucesso!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPwd(false);
  }

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
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className={`badge ${isPro ? "badge-red" : ""}`}>
              {isPro ? "PRO" : "Gratuito"}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container" style={{ maxWidth: "720px" }}>
        {msg && (
          <div className="alert alert-success" style={{ marginTop: "0" }}>
            {msg}
          </div>
        )}

        {/* Profile */}
        <div className="section-label">Perfil</div>
        <div
          className="card card-red-top"
          style={{ padding: "20px", marginBottom: "24px" }}
        >
          <form
            onSubmit={handleSaveName}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div className="form-group">
              <label className="form-label">Seu nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seu slug (URL)</label>
              <input value={trainer.slug} disabled style={{ opacity: 0.5 }} />
              <span className="form-hint">
                Link dos alunos:{" "}
                <strong style={{ color: "var(--accent)" }}>
                  seudominio.com/{trainer.slug}/[aluno]
                </strong>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar nome"}
              </button>
            </div>
          </form>
        </div>

        {/* Plano */}
        <div className="section-label" id="upgrade">
          Plano
        </div>
        <div
          className="card card-red-left"
          style={{
            padding: "18px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--text)",
              }}
            >
              {isPro ? "Plano Pro" : "Plano Gratuito"}
            </div>
            <p className="text-muted text-sm" style={{ marginTop: "4px" }}>
              {isPro
                ? "Alunos ilimitados · Tema personalizado"
                : "Até 3 alunos · Tema padrão · Entre em contato para fazer upgrade"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {!isPro && (
              <a
                href="mailto:contato@fitplan.app?subject=Upgrade Pro"
                className="btn btn-primary btn-sm"
              >
                Fazer Upgrade → Pro
              </a>
            )}
            {isPro && (
              <a
                href={`mailto:contato@fitplan.app?subject=Cancelamento de plano&body=Olá, gostaria de cancelar meu plano Pro. Meu e-mail cadastrado é: ${trainer.name}`}
                className="btn btn-outline btn-sm"
                style={{ color: "var(--muted)", borderColor: "var(--border)" }}
              >
                Cancelar plano
              </a>
            )}
          </div>
        </div>

        {/* Segurança */}
        <div className="section-label">Segurança</div>
        <div
          className="card card-red-top"
          style={{ padding: "20px", marginBottom: "24px" }}
        >
          {pwdMsg && (
            <div
              className={`alert ${pwdMsg.type === "success" ? "alert-success" : "alert-error"}`}
              style={{ marginBottom: "16px" }}
            >
              {pwdMsg.text}
            </div>
          )}
          <form
            onSubmit={handleChangePassword}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div className="form-group">
              <label className="form-label">Senha atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <span className="form-hint">Mínimo 6 caracteres</span>
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={savingPwd}
              >
                {savingPwd ? "Alterando..." : "Alterar senha"}
              </button>
            </div>
          </form>
        </div>

        {/* Theme editor */}
        <div className="section-label">
          Tema de Cores{" "}
          {!isPro && (
            <span className="badge badge-red" style={{ marginLeft: "8px" }}>
              PRO
            </span>
          )}
        </div>

        {!isPro && (
          <div className="alert alert-info" style={{ marginBottom: "16px" }}>
            Personalização de tema disponível no plano Pro. Faça upgrade acima
            para desbloquear.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isPro ? "1fr 280px" : "1fr",
            gap: "16px",
          }}
        >
          <div
            className={`card card-red-top ${isPro ? "" : "opacity-disabled"}`}
            style={{
              padding: "20px",
              opacity: isPro ? 1 : 0.4,
              pointerEvents: isPro ? "auto" : "none",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {COLOR_FIELDS.map((field) => (
                <div
                  key={field.key}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <input
                    type="color"
                    value={theme[field.key]}
                    onChange={(e) =>
                      setTheme((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    style={{
                      width: "48px",
                      height: "36px",
                      padding: "2px",
                      cursor: "pointer",
                      flex: "0 0 48px",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: "var(--text)",
                      }}
                    >
                      {field.label}
                    </div>
                    <div className="text-xs text-muted">{field.hint}</div>
                  </div>
                  <code
                    style={{
                      marginLeft: "auto",
                      fontSize: "0.75rem",
                      color: "var(--muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    {theme[field.key]}
                  </code>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  paddingTop: "8px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <button className="btn btn-outline btn-sm" onClick={resetTheme}>
                  Resetar padrão
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveTheme}
                  disabled={savingTheme}
                >
                  {savingTheme ? "Salvando..." : "Salvar tema"}
                </button>
              </div>
            </div>
          </div>

          {/* Live preview */}
          {isPro && (
            <div>
              <div className="section-label" style={{ marginTop: 0 }}>
                Visualização
              </div>
              <div
                style={{
                  ...previewVars,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "16px",
                  fontSize: "0.78rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.4rem",
                    color: "var(--primary)",
                    letterSpacing: "2px",
                    marginBottom: "10px",
                  }}
                >
                  PUSH A
                </div>
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderTop: "2px solid var(--primary)",
                    padding: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "var(--text)" }}>
                    Supino Inclinado
                  </div>
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: "0.72rem",
                      marginTop: "2px",
                    }}
                  >
                    Principal do treino. RIR 1–2.
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      color: "var(--muted)",
                      padding: "2px 8px",
                      borderRadius: "2px",
                      fontSize: "0.68rem",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    composto
                  </span>
                  <span
                    style={{
                      background: `${theme.primary}22`,
                      border: `1px solid ${theme.primaryDim}`,
                      color: theme.accent,
                      padding: "2px 8px",
                      borderRadius: "2px",
                      fontSize: "0.68rem",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    4 × 6–10
                  </span>
                </div>
                <div
                  style={{
                    background: theme.primary,
                    color: "#fff",
                    padding: "6px 12px",
                    borderRadius: "2px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    display: "inline-block",
                  }}
                >
                  Botão primário
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Trainer, TrainerTheme } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/types";

// ── Color derivation helpers ─────────────────────────────────
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}
function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}
function blend(hex1: string, hex2: string, t: number): string {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  if (!a || !b) return hex1;
  return rgbToHex(
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  );
}
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function deriveTheme(
  primary: string,
  bg: string,
  text: string,
  surfaceOverride?: string,
): TrainerTheme {
  const isLight = getLuminance(bg) > 0.4;
  const surface =
    surfaceOverride ?? (isLight ? darken(bg, 0.06) : lighten(bg, 0.08));
  const surface2 = isLight ? darken(surface, 0.08) : lighten(surface, 0.1);
  const border = isLight ? darken(surface, 0.22) : lighten(surface, 0.22);
  return {
    primary,
    primaryDim: darken(primary, 0.35),
    accent: isLight ? darken(primary, 0.1) : lighten(primary, 0.15),
    bg,
    surface,
    surface2,
    border,
    text,
    muted: blend(text, bg, 0.48),
  };
}

const KEY_COLOR_FIELDS: {
  key: "primary" | "bg" | "surface" | "text";
  label: string;
  hint: string;
}[] = [
  {
    key: "primary",
    label: "Cor primária",
    hint: "Destaques, botões e bordas principais",
  },
  {
    key: "bg",
    label: "Fundo da página",
    hint: "Cor de fundo geral",
  },
  {
    key: "surface",
    label: "Fundo dos cards",
    hint: "Cards, inputs e formulários — derivado do fundo ao resetar",
  },
  {
    key: "text",
    label: "Texto principal",
    hint: "Cor do texto — muted é derivado automaticamente",
  },
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

  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("trainers").update({ name }).eq("id", trainer.id);
    setMsg("Nome atualizado!");
    setSaving(false);
    router.refresh();
  }

  function handleKeyColorChange(
    key: "primary" | "bg" | "surface" | "text",
    value: string,
  ) {
    setTheme((prev) =>
      deriveTheme(
        key === "primary" ? value : prev.primary,
        key === "bg" ? value : prev.bg,
        key === "text" ? value : prev.text,
        // When bg changes, re-derive surface automatically.
        // When surface is explicitly changed, use that value.
        // Otherwise keep the current surface.
        key === "bg" ? undefined : key === "surface" ? value : prev.surface,
      ),
    );
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

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteError("");
    const res = await fetch("/api/delete-account", { method: "DELETE" });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/login");
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Erro ao excluir conta.");
      setDeletingAccount(false);
    }
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

        <div className="theme-editor-grid">
          <div
            className="card card-red-top"
            style={{
              padding: "20px",
              opacity: isPro ? 1 : 0.4,
              pointerEvents: isPro ? "auto" : "none",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {KEY_COLOR_FIELDS.map((field) => (
                <div
                  key={field.key}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <input
                    type="color"
                    value={theme[field.key]}
                    onChange={(e) =>
                      handleKeyColorChange(field.key, e.target.value)
                    }
                    style={{
                      width: "48px",
                      height: "40px",
                      padding: "2px",
                      cursor: "pointer",
                      flex: "0 0 48px",
                      border: "none",
                      borderRadius: "4px",
                      background: "transparent",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.85rem",
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
                      fontSize: "0.75rem",
                      color: "var(--muted)",
                      fontFamily: "monospace",
                      flexShrink: 0,
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
            <div className="card" style={{ padding: "16px" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "12px",
                }}
              >
                Pré-visualização
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
                {/* mini header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--surface)",
                    borderBottom: `2px solid var(--primary)`,
                    padding: "8px 12px",
                    marginBottom: "12px",
                    borderRadius: "2px 2px 0 0",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.1rem",
                      color: "var(--primary)",
                      letterSpacing: "2px",
                    }}
                  >
                    FIT<span style={{ color: "var(--text)" }}>PLAN</span>
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--muted)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    PUSH A
                  </span>
                </div>
                {/* exercise card */}
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderLeft: "3px solid var(--primary)",
                    padding: "10px 12px",
                    marginBottom: "8px",
                    borderRadius: "2px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: "4px",
                    }}
                  >
                    Supino Inclinado
                  </div>
                  <div
                    style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}
                  >
                    <span
                      style={{
                        background: `${theme.primary}22`,
                        border: `1px solid ${theme.primaryDim}`,
                        color: theme.accent,
                        padding: "2px 8px",
                        borderRadius: "2px",
                        fontSize: "0.65rem",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      4 × 6–10
                    </span>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                        color: "var(--muted)",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        fontSize: "0.65rem",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      composto
                    </span>
                  </div>
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: "0.7rem",
                      marginTop: "4px",
                    }}
                  >
                    RIR 1–2
                  </div>
                </div>
                <div
                  style={{
                    background: theme.primary,
                    color: "#fff",
                    padding: "6px 14px",
                    borderRadius: "2px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    display: "inline-block",
                  }}
                >
                  Iniciar Treino
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zona de perigo */}
        <div
          className="section-label"
          style={{ color: "#e8192c", marginTop: "32px" }}
        >
          Zona de Perigo
        </div>
        <div
          className="card"
          style={{
            padding: "20px",
            marginBottom: "32px",
            border: "1px solid rgba(232,25,44,0.3)",
          }}
        >
          {deleteError && (
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
              {deleteError}
            </div>
          )}
          {!deleteConfirm ? (
            <div
              style={{
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
                    fontSize: "1rem",
                    color: "var(--text)",
                  }}
                >
                  Excluir minha conta
                </div>
                <p className="text-muted text-sm" style={{ marginTop: "4px" }}>
                  Remove permanentemente sua conta, alunos e todos os dados.
                  Ação irreversível.
                </p>
              </div>
              <button
                className="btn btn-sm"
                style={{
                  background: "rgba(232,25,44,0.12)",
                  color: "#e8192c",
                  border: "1px solid rgba(232,25,44,0.4)",
                }}
                onClick={() => setDeleteConfirm(true)}
              >
                Excluir conta
              </button>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <p style={{ color: "var(--text)", fontWeight: 600 }}>
                Tem certeza? Esta ação é irreversível e todos os seus dados
                serão apagados.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn btn-sm"
                  style={{
                    background: "#e8192c",
                    color: "#fff",
                    border: "none",
                  }}
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount
                    ? "Excluindo..."
                    : "Sim, excluir permanentemente"}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setDeleteConfirm(false);
                    setDeleteError("");
                  }}
                  disabled={deletingAccount}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

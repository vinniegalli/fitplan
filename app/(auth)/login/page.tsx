"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            className="logo"
            style={{
              justifyContent: "center",
              display: "flex",
              fontSize: "2.4rem",
            }}
          >
            FIT<span>PLAN</span>
          </div>
          <p className="text-muted text-sm" style={{ marginTop: "8px" }}>
            Entre na sua conta de personal
          </p>
        </div>

        <div className="card card-red-top" style={{ padding: "28px" }}>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: "0.78rem", color: "var(--muted)" }}
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ justifyContent: "center", marginTop: "8px" }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p
          className="text-muted text-sm"
          style={{ textAlign: "center", marginTop: "20px" }}
        >
          Não tem conta?{" "}
          <Link href="/register" style={{ color: "var(--accent)" }}>
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}

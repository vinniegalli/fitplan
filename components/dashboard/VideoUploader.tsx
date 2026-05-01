"use client";

import { useState, useRef } from "react";
import type { VideoType } from "@/lib/types";

interface Props {
  exerciseId: string;
  currentUrl: string | null;
  currentType: VideoType | null;
  onSaved: (url: string | null, type: VideoType | null) => void;
  isPro: boolean;
}

export default function VideoUploader({
  exerciseId,
  currentUrl,
  currentType,
  onSaved,
  isPro,
}: Props) {
  const [mode, setMode] = useState<"idle" | "upload" | "url">("idle");
  const [urlInput, setUrlInput] = useState(currentUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_CLIENT_MB = 30;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_CLIENT_MB * 1024 * 1024) {
      setError(
        `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(0)} MB). Limite: ${MAX_CLIENT_MB} MB. Para vídeos maiores, use uma URL do YouTube.`,
      );
      // reset the input so the same file can be re-selected after compression
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/exercises/${exerciseId}/video`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro no upload");
      return;
    }
    onSaved(data.video_url, data.video_type);
    setMode("idle");
  }

  async function handleUrlSave() {
    if (!urlInput.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/exercises/${exerciseId}/video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlInput.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar URL");
      return;
    }
    onSaved(data.video_url, data.video_type);
    setMode("idle");
  }

  async function handleRemove() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/exercises/${exerciseId}/video`, {
      method: "DELETE",
    });
    setLoading(false);
    if (!res.ok) {
      setError("Erro ao remover vídeo");
      return;
    }
    onSaved(null, null);
    setUrlInput("");
    setMode("idle");
  }

  const hasVideo = !!currentUrl;

  if (!isPro) {
    return (
      <div style={{ fontSize: "0.75rem" }}>
        <a
          href="/settings#upgrade"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontSize: "0.7rem",
            color: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "3px 8px",
            textDecoration: "none",
          }}
          title="Vídeos personalizados são exclusivos do plano Pro"
        >
          🔒 PRO
        </a>
      </div>
    );
  }

  return (
    <div style={{ fontSize: "0.8rem" }}>
      {error && (
        <p style={{ color: "var(--primary)", marginBottom: "4px" }}>{error}</p>
      )}

      {mode === "idle" && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {hasVideo && (
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.7rem",
                color: "var(--muted)",
                alignSelf: "center",
              }}
            >
              {currentType === "custom" ? "📹 Arquivo" : "🔗 Link"}
            </span>
          )}
          <button
            onClick={() => setMode("upload")}
            disabled={loading}
            style={btnStyle}
          >
            {hasVideo ? "Trocar arquivo" : "Upload vídeo"}
          </button>
          <button
            onClick={() => setMode("url")}
            disabled={loading}
            style={btnStyle}
          >
            {hasVideo && currentType === "external"
              ? "Trocar URL"
              : "URL externa"}
          </button>
          {hasVideo && (
            <button
              onClick={handleRemove}
              disabled={loading}
              style={{
                ...btnStyle,
                color: "var(--primary)",
                borderColor: "var(--primary-dim)",
              }}
            >
              {loading ? "..." : "Remover"}
            </button>
          )}
        </div>
      )}

      {mode === "upload" && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            style={btnStyle}
          >
            {loading ? "Enviando..." : "Escolher arquivo (.mp4, .webm, .mov)"}
          </button>
          <button onClick={() => setMode("idle")} style={btnStyle}>
            Cancelar
          </button>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.65rem",
              color: "var(--muted)",
              width: "100%",
              marginTop: "2px",
            }}
          >
            Máx. 30 MB · Dica: grave em 720p ou use URL do YouTube para evitar
            limite
          </span>
        </div>
      )}

      {mode === "url" && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            style={{
              flex: 1,
              minWidth: "200px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              color: "var(--text)",
              padding: "5px 8px",
              fontSize: "0.8rem",
              outline: "none",
            }}
          />
          <button
            onClick={handleUrlSave}
            disabled={loading || !urlInput.trim()}
            style={btnStyle}
          >
            {loading ? "..." : "Salvar"}
          </button>
          <button onClick={() => setMode("idle")} style={btnStyle}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "0.72rem",
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "var(--muted)",
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  padding: "4px 10px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

"use client";

import type { VideoType } from "@/lib/types";

interface Props {
  url: string;
  type: VideoType | null;
  title?: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID or youtu.be/ID or youtube.com/embed/ID
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const videoId =
        u.searchParams.get("v") ||
        (u.hostname === "youtu.be" ? u.pathname.slice(1) : null) ||
        (u.pathname.startsWith("/embed/") ? u.pathname.split("/")[2] : null);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    // invalid URL
  }
  return null;
}

export default function VideoPlayer({
  url,
  type,
  title = "Demonstração",
}: Props) {
  const isExternal = type === "external";
  const embedUrl = isExternal ? getYouTubeEmbedUrl(url) : null;

  if (isExternal && embedUrl) {
    return (
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          borderRadius: "6px",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    );
  }

  // Custom upload or system URL — use HTML5 video
  return (
    <video
      src={url}
      controls
      preload="metadata"
      playsInline
      style={{
        width: "100%",
        maxHeight: "280px",
        borderRadius: "6px",
        background: "#000",
        display: "block",
      }}
    >
      <track kind="captions" />
    </video>
  );
}

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_THEME } from "@/lib/types";
import type { TrainerTheme } from "@/lib/types";

export default async function TrainerPublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ trainerSlug: string }>;
}) {
  const { trainerSlug } = await params;
  const supabase = await createClient();

  let theme: TrainerTheme = DEFAULT_THEME;

  const { data: trainer } = await supabase
    .from("trainers")
    .select("theme")
    .eq("slug", trainerSlug)
    .single();

  if (trainer?.theme) {
    theme = { ...DEFAULT_THEME, ...trainer.theme };
  }

  const css = `
    :root {
      --primary: ${theme.primary};
      --primary-dim: ${theme.primaryDim};
      --bg: ${theme.bg};
      --surface: ${theme.surface};
      --surface2: ${theme.surface2};
      --border: ${theme.border};
      --text: ${theme.text};
      --muted: ${theme.muted};
      --accent: ${theme.accent};
      --red: ${theme.primary};
      --red-dim: ${theme.primaryDim};
    }
    html, body { background-color: ${theme.bg} !important; color: ${theme.text} !important; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}
      >
        {children}
      </div>
    </>
  );
}

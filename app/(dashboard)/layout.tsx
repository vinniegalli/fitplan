import { createClient } from "@/lib/supabase/server";
import { DEFAULT_THEME } from "@/lib/types";
import type { TrainerTheme } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let theme: TrainerTheme = DEFAULT_THEME;

  if (user) {
    const { data: trainer } = await supabase
      .from("trainers")
      .select("theme")
      .eq("user_id", user.id)
      .single();

    if (trainer?.theme) {
      theme = { ...DEFAULT_THEME, ...trainer.theme };
    }
  }

  const cssVars = {
    "--primary": theme.primary,
    "--primary-dim": theme.primaryDim,
    "--bg": theme.bg,
    "--surface": theme.surface,
    "--surface2": theme.surface2,
    "--border": theme.border,
    "--text": theme.text,
    "--muted": theme.muted,
    "--accent": theme.accent,
    "--red": theme.primary,
    "--red-dim": theme.primaryDim,
    // Apply directly so body background is also overridden
    background: theme.bg,
    color: theme.text,
    minHeight: "100vh",
  } as React.CSSProperties;

  return <div style={cssVars}>{children}</div>;
}

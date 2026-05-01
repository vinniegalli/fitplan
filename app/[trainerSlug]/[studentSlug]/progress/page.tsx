import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TrainerTheme } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/types";
import ProgressPageClient from "./ProgressPageClient";

export default async function ProgressPage({
  params,
}: {
  params: Promise<{ trainerSlug: string; studentSlug: string }>;
}) {
  const { trainerSlug, studentSlug } = await params;
  const supabase = await createClient();

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name, slug, plan, theme")
    .eq("slug", trainerSlug)
    .single();

  if (!trainer) notFound();

  const { data: student } = await supabase
    .from("students")
    .select("id, name, slug")
    .eq("trainer_id", trainer.id)
    .eq("slug", studentSlug)
    .eq("active", true)
    .single();

  if (!student) notFound();

  const theme: TrainerTheme =
    trainer.plan === "pro"
      ? { ...DEFAULT_THEME, ...(trainer.theme as TrainerTheme) }
      : DEFAULT_THEME;

  return (
    <ProgressPageClient
      trainerSlug={trainerSlug}
      studentSlug={studentSlug}
      student={student}
      theme={theme}
    />
  );
}

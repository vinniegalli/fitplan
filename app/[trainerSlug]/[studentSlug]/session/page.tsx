import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TrainerTheme, Exercise } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/types";
import WorkoutSessionClient from "./WorkoutSessionClient";

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ trainerSlug: string; studentSlug: string }>;
  searchParams: Promise<{ day?: string; week?: string }>;
}) {
  const { trainerSlug, studentSlug } = await params;
  const { day: dayId, week: weekStr } = await searchParams;

  if (!dayId || !weekStr) notFound();
  const weekNumber = parseInt(weekStr, 10);
  if (isNaN(weekNumber)) notFound();

  const supabase = await createClient();

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name, slug, plan, theme")
    .eq("slug", trainerSlug)
    .single();

  if (!trainer) notFound();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("trainer_id", trainer.id)
    .eq("slug", studentSlug)
    .eq("active", true)
    .single();

  if (!student) notFound();

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("student_id", student.id)
    .eq("active", true)
    .maybeSingle();

  if (!plan) notFound();

  const { data: day } = await supabase
    .from("workout_days")
    .select("*")
    .eq("id", dayId)
    .eq("plan_id", plan.id)
    .single();

  if (!day) notFound();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("workout_day_id", day.id)
    .order("exercise_order");

  const { data: periodWeek } = await supabase
    .from("periodization_weeks")
    .select("*")
    .eq("plan_id", plan.id)
    .eq("week_number", weekNumber)
    .single();

  const theme: TrainerTheme =
    trainer.plan === "pro"
      ? { ...DEFAULT_THEME, ...(trainer.theme as TrainerTheme) }
      : DEFAULT_THEME;

  return (
    <WorkoutSessionClient
      trainerSlug={trainerSlug}
      studentSlug={studentSlug}
      student={student}
      day={day}
      exercises={(exercises ?? []) as Exercise[]}
      periodWeek={periodWeek ?? null}
      weekNumber={weekNumber}
      theme={theme}
    />
  );
}

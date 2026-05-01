import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TrainerTheme, Exercise } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/types";
import PublicPlanView from "./PublicPlanView";
import AccessBlocked from "./AccessBlocked";

export default async function StudentPublicPage({
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
    .select("*")
    .eq("trainer_id", trainer.id)
    .eq("slug", studentSlug)
    .single();

  if (!student) notFound();

  if (!student.active) {
    return <AccessBlocked trainerName={trainer.name} />;
  }

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("student_id", student.id)
    .eq("active", true)
    .maybeSingle();

  if (!plan) notFound();

  const { data: days } = await supabase
    .from("workout_days")
    .select("*")
    .eq("plan_id", plan.id)
    .order("day_order");

  const workoutDays = days ?? [];
  const exercisesByDay: Record<string, Exercise[]> = {};

  for (const day of workoutDays) {
    const { data: exs } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_day_id", day.id)
      .order("exercise_order");
    exercisesByDay[day.id] = exs ?? [];
  }

  const { data: periodWeeks } = await supabase
    .from("periodization_weeks")
    .select("*")
    .eq("plan_id", plan.id)
    .order("week_number");

  const theme: TrainerTheme =
    trainer.plan === "pro"
      ? { ...DEFAULT_THEME, ...(trainer.theme as TrainerTheme) }
      : DEFAULT_THEME;

  return (
    <PublicPlanView
      trainerName={trainer.name}
      trainerSlug={trainerSlug}
      studentSlug={studentSlug}
      student={student}
      plan={plan}
      days={workoutDays}
      exercisesByDay={exercisesByDay}
      periodWeeks={periodWeeks ?? []}
      theme={theme}
    />
  );
}

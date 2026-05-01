import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/sessions — create a new workout session
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { student_id, workout_day_id, week_number } = body;

  if (!student_id || !workout_day_id || !week_number) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ student_id, workout_day_id, week_number })
    .select("id, started_at")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

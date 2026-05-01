import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// POST /api/sessions/[id]/sets — upsert all sets for a session in one call
// Body: { sets: Array<{ exercise_id, set_number, weight, reps, completed }> }
export async function POST(req: NextRequest, { params }: Params) {
  const { id: session_id } = await params;
  const body = await req.json();
  const sets: Array<{
    exercise_id: string;
    set_number: number;
    weight: number | null;
    reps: number | null;
    completed: boolean;
  }> = body.sets;

  if (!Array.isArray(sets) || sets.length === 0) {
    return NextResponse.json({ error: "sets array required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Delete existing sets for this session then re-insert (simpler than upsert with composite key)
  const { error: delErr } = await supabase
    .from("set_records")
    .delete()
    .eq("session_id", session_id);

  if (delErr)
    return NextResponse.json({ error: delErr.message }, { status: 500 });

  const rows = sets.map((s) => ({
    session_id,
    exercise_id: s.exercise_id,
    set_number: s.set_number,
    weight: s.weight,
    reps: s.reps,
    completed: s.completed,
  }));

  const { error } = await supabase.from("set_records").insert(rows);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

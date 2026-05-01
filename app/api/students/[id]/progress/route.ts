import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/students/[id]/progress?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns: per-exercise progression data aggregated by session
export async function GET(req: NextRequest, { params }: Params) {
  const { id: student_id } = await params;
  const { searchParams } = new URL(req.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createClient();

  let sessionsQuery = supabase
    .from("workout_sessions")
    .select("id, started_at, week_number, workout_day_id")
    .eq("student_id", student_id)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: true });

  if (from) sessionsQuery = sessionsQuery.gte("started_at", from);
  if (to) sessionsQuery = sessionsQuery.lte("started_at", to + "T23:59:59Z");

  const { data: sessions, error: sessErr } = await sessionsQuery;
  if (sessErr)
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  if (!sessions || sessions.length === 0) return NextResponse.json([]);

  const sessionIds = sessions.map((s) => s.id);

  const { data: sets, error: setsErr } = await supabase
    .from("set_records")
    .select("session_id, exercise_id, weight, reps, completed")
    .in("session_id", sessionIds)
    .eq("completed", true);

  if (setsErr)
    return NextResponse.json({ error: setsErr.message }, { status: 500 });

  // Pull exercise names so we can label the chart
  const exerciseIds = [...new Set((sets ?? []).map((s) => s.exercise_id))];
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name")
    .in("id", exerciseIds);

  const exerciseMap: Record<string, string> = {};
  for (const ex of exercises ?? []) exerciseMap[ex.id] = ex.name;

  // session_id → started_at
  const sessionMeta: Record<
    string,
    { started_at: string; week_number: number }
  > = {};
  for (const s of sessions)
    sessionMeta[s.id] = {
      started_at: s.started_at,
      week_number: s.week_number,
    };

  // Group: exercise_id -> array of { date, week, maxWeight, totalVolume, totalReps, sets }
  const grouped: Record<
    string,
    {
      exercise_id: string;
      name: string;
      dataPoints: Array<{
        date: string;
        week: number;
        maxWeight: number;
        totalVolume: number;
        totalReps: number;
        sets: number;
      }>;
    }
  > = {};

  for (const set of sets ?? []) {
    if (!grouped[set.exercise_id]) {
      grouped[set.exercise_id] = {
        exercise_id: set.exercise_id,
        name: exerciseMap[set.exercise_id] ?? "Desconhecido",
        dataPoints: [],
      };
    }
    const meta = sessionMeta[set.session_id];
    if (!meta) continue;

    // One data point per session per exercise (aggregate all sets)
    let point = grouped[set.exercise_id].dataPoints.find(
      (p) => p.date === meta.started_at.slice(0, 10),
    );
    if (!point) {
      point = {
        date: meta.started_at.slice(0, 10),
        week: meta.week_number,
        maxWeight: 0,
        totalVolume: 0,
        totalReps: 0,
        sets: 0,
      };
      grouped[set.exercise_id].dataPoints.push(point);
    }
    const w = set.weight ?? 0;
    const r = set.reps ?? 0;
    if (w > point.maxWeight) point.maxWeight = w;
    point.totalVolume += w * r;
    point.totalReps += r;
    point.sets += 1;
  }

  return NextResponse.json(Object.values(grouped));
}

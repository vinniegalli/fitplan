import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

const BUCKET = "exercise-videos";
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

// POST /api/exercises/[id]/video — upload a custom video or set external URL
// Supports two modes:
//   - multipart/form-data with field "file" → upload to Supabase Storage
//   - application/json with { url: string } → save external URL (e.g. YouTube)
export async function POST(req: NextRequest, { params }: Params) {
  const { id: exercise_id } = await params;
  const supabase = await createClient();

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "Arquivo excede o limite de 30 MB. Use uma URL do YouTube para vídeos maiores.",
        },
        { status: 413 },
      );
    }
    if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
      return NextResponse.json(
        { error: "Only mp4, webm, or mov files accepted" },
        { status: 415 },
      );
    }

    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `${exercise_id}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadErr)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { error: updateErr } = await supabase
      .from("exercises")
      .update({
        video_url: publicUrl,
        video_type: "custom",
        video_storage_path: path,
      })
      .eq("id", exercise_id);

    if (updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json(
      { video_url: publicUrl, video_type: "custom" },
      { status: 201 },
    );
  }

  // JSON body: external URL
  const body = await req.json();
  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("exercises")
    .update({
      video_url: body.url,
      video_type: "external",
      video_storage_path: null,
    })
    .eq("id", exercise_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { video_url: body.url, video_type: "external" },
    { status: 200 },
  );
}

// DELETE /api/exercises/[id]/video — remove video from exercise
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: exercise_id } = await params;
  const supabase = await createClient();

  // Fetch current storage path to clean up
  const { data: ex } = await supabase
    .from("exercises")
    .select("video_storage_path")
    .eq("id", exercise_id)
    .single();

  if (ex?.video_storage_path) {
    await supabase.storage.from(BUCKET).remove([ex.video_storage_path]);
  }

  const { error } = await supabase
    .from("exercises")
    .update({ video_url: null, video_type: null, video_storage_path: null })
    .eq("id", exercise_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

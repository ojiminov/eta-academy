// POST /api/upload
// Accepts a file as FormData, uploads it to Supabase Storage server-side,
// and returns the public URL. Files pass through our server but this avoids
// signed-URL JWT signature issues.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_MAP: Record<string, string> = {
  homework:    "homework-files",
  submission:  "homework-submissions",
  material:    "course-materials",
  student_doc: "student-documents",
  branding:    "branding-files",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const bucket   = formData.get("bucket") as string | null;

  if (!file || !bucket) {
    return NextResponse.json({ error: "file and bucket are required" }, { status: 400 });
  }

  const bucketName = BUCKET_MAP[bucket];
  if (!bucketName) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const userId   = session.userId.replace(/[^a-zA-Z0-9-]/g, "");
  const path     = `${userId}/${Date.now()}-${safeName}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("[upload] bucket:", bucketName, "path:", path, "error:", error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message} | bucket=${bucketName} path=${path} userId=${session.userId}` },
      { status: 500 }
    );
  }

  const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(path);

  return NextResponse.json({
    publicUrl: pub.publicUrl,
    path,
    name: file.name,
    size: file.size,
  });
}

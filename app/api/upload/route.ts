// POST /api/upload
// Returns a signed Supabase Storage upload URL.
// The client uploads directly to Supabase (no file passes through our server).

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Bucket names — create these in Supabase Storage dashboard
const BUCKET_MAP: Record<string, string> = {
  homework:     "homework-files",      // teacher assignment files
  submission:   "homework-submissions", // student submissions
  material:     "course-materials",    // syllabi / lesson resources
  student_doc:  "student-documents",   // admin uploads per student
  branding:     "branding-files",      // academy logos and branding assets
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bucket, fileName, contentType } = await req.json();
  if (!bucket || !fileName) {
    return NextResponse.json({ error: "bucket and fileName required" }, { status: 400 });
  }

  const bucketName = BUCKET_MAP[bucket];
  if (!bucketName) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  // Build a unique path: userId/timestamp-filename
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${session.userId}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 });
  }

  // Public URL for reading the file after upload
  const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl: pub.publicUrl,
  });
}

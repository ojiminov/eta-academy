import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NOT SET";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "NOT SET";

  const keyPreview = key.length > 20
    ? `${key.slice(0, 10)}...${key.slice(-10)} (${key.length} chars)`
    : key;

  // Try to list buckets
  let bucketsResult: any = null;
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.storage.listBuckets();
    bucketsResult = error ? { error: error.message } : { buckets: data?.map(b => b.name) };
  } catch (e: any) {
    bucketsResult = { threw: e.message };
  }

  return NextResponse.json({ url, keyPreview, bucketsResult });
}

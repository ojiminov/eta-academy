// POST /api/push/register
// Called by the OneSignal SDK after the user grants notification permission.
// Links the OneSignal playerId to our userId as an external_id so we can
// target specific users by our own ID without storing any tokens ourselves.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { playerId } = await req.json();
  if (!playerId) return NextResponse.json({ error: "playerId required" }, { status: 400 });

  const appId      = process.env.ONESIGNAL_APP_ID      ?? "";
  const apiKey     = process.env.ONESIGNAL_REST_API_KEY ?? "";

  if (!appId || !apiKey) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    // Link OneSignal device to our userId as external_id
    await fetch(`https://onesignal.com/api/v1/players/${playerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${apiKey}` },
      body: JSON.stringify({ app_id: appId, external_user_id: session.userId }),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/register]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

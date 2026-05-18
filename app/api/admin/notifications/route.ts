// POST /api/admin/notifications — send a manual push notification
// ADMIN only. Targets: "all" | "students" | "teachers" | "parents"

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendPush } from "@/lib/onesignal";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, target } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "title and body required" }, { status: 400 });

  // target: "all" | "students" | "teachers" | "parents"
  const roleMap: Record<string, string> = {
    students: "STUDENT",
    teachers: "TEACHER",
    parents:  "PARENT",
  };

  if (!target || target === "all") {
    await sendPush({ toAll: true, title: `📢 ${title}`, body, url: "https://eta-academy.vercel.app" });
    return NextResponse.json({ ok: true, sent: "all" });
  }

  const role = roleMap[target];
  if (!role) return NextResponse.json({ error: "Invalid target" }, { status: 400 });

  const users = await prisma.user.findMany({ where: { role: role as any }, select: { id: true } });
  const userIds = users.map(u => u.id);

  await sendPush({ userIds, title: `📢 ${title}`, body, url: "https://eta-academy.vercel.app" });
  return NextResponse.json({ ok: true, sent: userIds.length });
}

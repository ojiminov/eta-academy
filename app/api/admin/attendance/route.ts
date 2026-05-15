import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;
  if (from || to) {
    where.scheduledAt = {};
    if (from) (where.scheduledAt as Record<string, Date>).gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      (where.scheduledAt as Record<string, Date>).lte = toDate;
    }
  }

  // For teachers, restrict to their own groups
  if (session.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.userId } });
    if (teacher) where.teacherId = teacher.id;
  }

  const sessions = await prisma.classSession.findMany({
    where,
    include: {
      group: true,
      teacher: { include: { user: true } },
      attendances: {
        include: { student: { include: { user: true } } },
      },
    },
    orderBy: { scheduledAt: "desc" },
    take: 100,
  });

  return NextResponse.json(sessions);
}

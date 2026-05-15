import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.userId } });
  if (!teacher && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const where = teacher
    ? { teacherId: teacher.id, scheduledAt: { gte: todayStart, lte: todayEnd } }
    : { scheduledAt: { gte: todayStart, lte: todayEnd } };

  const sessions = await prisma.classSession.findMany({
    where,
    include: {
      group: {
        include: {
          groupStudents: {
            where: { isActive: true },
            include: { student: { include: { user: true } } },
          },
        },
      },
      attendances: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(sessions);
}

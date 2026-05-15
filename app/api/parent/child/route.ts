import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const parent = await prisma.parent.findFirst({
      where: { userId: session.userId },
      include: {
        student: {
          include: {
            user: true,
            groupStudents: {
              where: { isActive: true },
              include: { group: { include: { teacher: { include: { user: true } } } } },
            },
            payments: { orderBy: { createdAt: "desc" }, take: 10 },
            grades: { orderBy: { createdAt: "desc" }, take: 10 },
            homeworkGrades: {
              include: { homework: { include: { group: true } } },
              orderBy: { homework: { dueDate: "desc" } },
              take: 10,
            },
            examResults: {
              include: { exam: { include: { group: true } } },
              orderBy: { exam: { scheduledAt: "desc" } },
              take: 10,
            },
          },
        },
      },
    });

    if (!parent) return NextResponse.json({ error: "Parent record not found" }, { status: 404 });

    // Get recent attendance
    const attendances = await prisma.attendance.findMany({
      where: { studentId: parent.studentId },
      include: { classSession: { include: { group: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ parent, attendances });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

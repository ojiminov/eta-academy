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
      select: {
        id: true,
        studentId: true,
        student: {
          select: {
            id: true,
            balance: true,
            discountPercent: true,
            enrollmentDate: true,
            status: true,
            englishLevel: true,
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            groupStudents: {
              where: { isActive: true },
              select: {
                id: true,
                group: {
                  select: {
                    id: true, name: true, schedule: true, level: true, monthlyFee: true, room: true,
                    teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
                  },
                },
              },
            },
            payments: {
              orderBy: { createdAt: "desc" },
              take: 10,
              select: { id: true, amount: true, status: true, paidAt: true, createdAt: true, notes: true },
            },
            homeworkGrades: {
              include: { homework: { select: { title: true, dueDate: true, maxScore: true, group: { select: { name: true } } } } },
              orderBy: { homework: { dueDate: "desc" } },
              take: 10,
            },
            examResults: {
              include: { exam: { select: { title: true, scheduledAt: true, maxScore: true, group: { select: { name: true } } } } },
              orderBy: { exam: { scheduledAt: "desc" } },
              take: 10,
            },
          },
        },
      },
    });

    if (!parent) return NextResponse.json({ error: "Parent record not found" }, { status: 404 });
    if (!parent.student) return NextResponse.json({ error: "No student linked to this parent account" }, { status: 404 });

    // Run attendance fetch in parallel (already have parent data)
    const attendances = await prisma.attendance.findMany({
      where: { studentId: parent.studentId },
      select: {
        id: true, status: true, createdAt: true,
        classSession: { select: { scheduledAt: true, group: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ parent, attendances });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

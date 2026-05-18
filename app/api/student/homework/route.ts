import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const student = await prisma.student.findFirst({ where: { userId: session.userId } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const grades = await prisma.homeworkGrade.findMany({
      where: { studentId: student.id },
      include: {
        homework: {
          include: { group: true, teacher: { include: { user: true } } },
        },
      },
      orderBy: { homework: { dueDate: "desc" } },
    });
    return NextResponse.json(grades);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/student/homework — submit a file or mark submitted
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { homeworkGradeId, submissionUrl, submissionName, submissionSize } = await req.json();
    if (!homeworkGradeId) {
      return NextResponse.json({ error: "homeworkGradeId required" }, { status: 400 });
    }

    // Verify this grade belongs to the current student
    const student = await prisma.student.findFirst({ where: { userId: session.userId } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const grade = await prisma.homeworkGrade.findFirst({
      where: { id: homeworkGradeId, studentId: student.id },
    });
    if (!grade) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.homeworkGrade.update({
      where: { id: homeworkGradeId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submissionUrl: submissionUrl || null,
        submissionName: submissionName || null,
        submissionSize: submissionSize ? parseInt(submissionSize) : null,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

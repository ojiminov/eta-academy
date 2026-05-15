import { NextResponse } from "next/server";
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

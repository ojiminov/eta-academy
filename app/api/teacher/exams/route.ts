import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
function newId() { return randomBytes(12).toString("base64url"); }

export async function GET() {
  const session = await getSession();
  if (!session || !["ADMIN","TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const where = session.role === "TEACHER" ? { teacher: { userId: session.userId } } : {};
    const exams = await prisma.exam.findMany({
      where, include: { group: true, teacher: { include: { user: true } }, results: { include: { student: { include: { user: true } } } } },
      orderBy: { scheduledAt: "desc" },
    });
    return NextResponse.json(exams);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN","TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { groupId, title, description, scheduledAt, duration, maxScore } = await req.json();
    if (!groupId || !title || !scheduledAt) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }
    const teacher = await prisma.teacher.findFirst({ where: { userId: session.userId } });
    if (!teacher) return NextResponse.json({ error: "Teacher record not found for this user" }, { status: 404 });

    const groupStudents = await prisma.groupStudent.findMany({ where: { groupId, isActive: true } });
    const exam = await prisma.exam.create({
      data: {
        id: newId(), groupId, teacherId: teacher!.id, title,
        description: description || null,
        scheduledAt: new Date(scheduledAt),
        duration: duration ? parseInt(duration) : null,
        maxScore: maxScore ? parseFloat(maxScore) : 100,
        results: { create: groupStudents.map(gs => ({ id: newId(), studentId: gs.studentId })) },
      },
      include: { group: true, results: true },
    });
    return NextResponse.json(exam, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

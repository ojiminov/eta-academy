import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: mark or update a single attendance record
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, studentId, status, notes } = await req.json();
  if (!sessionId || !studentId || !status) {
    return NextResponse.json({ error: "sessionId, studentId, status required" }, { status: 400 });
  }

  const validStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "HOLIDAY", "HW_NOT_DONE"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify session belongs to this teacher (or admin)
  if (session.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.userId } });
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    const cs = await prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!cs || cs.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Not your session" }, { status: 403 });
    }
  }

  const attendance = await prisma.attendance.upsert({
    where: { classSessionId_studentId: { classSessionId: sessionId, studentId } },
    create: { classSessionId: sessionId, studentId, status, notes: notes || null },
    update: { status, notes: notes || null },
  });

  return NextResponse.json(attendance);
}

// GET: get all attendance for a session
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const attendances = await prisma.attendance.findMany({
    where: { classSessionId: sessionId },
    include: { student: { include: { user: true } } },
  });

  return NextResponse.json(attendances);
}

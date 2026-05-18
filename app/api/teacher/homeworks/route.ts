import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { randomBytes } from "crypto";
import { notifyHomeworkAssigned } from "@/lib/onesignal";

export const dynamic = "force-dynamic";
function newId() { return randomBytes(12).toString("base64url"); }

export async function GET() {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const where = session.role === "TEACHER"
      ? { teacher: { userId: session.userId } }
      : {};
    const homeworks = await prisma.homework.findMany({
      where,
      include: {
        group: true,
        teacher: { include: { user: true } },
        grades: { include: { student: { include: { user: true } } } },
      },
      orderBy: { dueDate: "desc" },
    });
    return NextResponse.json(homeworks);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { groupId, title, description, dueDate, returnDate, maxScore, fileUrl, fileName, fileSize } = await req.json();
    if (!groupId || !title || !dueDate) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // Find teacher record
    const teacher = await prisma.teacher.findFirst({ where: { userId: session.userId } });
    if (!teacher && session.role === "TEACHER") {
      return NextResponse.json({ error: "Teacher record not found" }, { status: 404 });
    }

    // Get group students to auto-create HomeworkGrade entries
    const groupStudents = await prisma.groupStudent.findMany({
      where: { groupId, isActive: true },
    });

    const homework = await prisma.homework.create({
      data: {
        id: newId(),
        groupId,
        teacherId: teacher!.id,
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        returnDate: returnDate ? new Date(returnDate) : null,
        maxScore: maxScore ? parseFloat(maxScore) : 100,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize ? parseInt(fileSize) : null,
        grades: {
          create: groupStudents.map(gs => ({
            id: newId(),
            studentId: gs.studentId,
            status: "ASSIGNED",
          })),
        },
      },
      include: { group: true, grades: true },
    });

    // 🔔 Notify students in the group (fire-and-forget)
    prisma.groupStudent.findMany({
      where: { groupId, isActive: true },
      include: { student: { include: { user: true } } },
    }).then(gs => {
      const userIds = gs.map(g => g.student.userId);
      notifyHomeworkAssigned(userIds, title, homework.group.name, new Date(dueDate)).catch(() => {});
    }).catch(() => {});

    return NextResponse.json(homework, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

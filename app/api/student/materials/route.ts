import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/student/materials — list materials for groups the student is in
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const student = await prisma.student.findFirst({ where: { userId: session.userId } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Get all groups the student is active in
    const groupStudents = await prisma.groupStudent.findMany({
      where: { studentId: student.id, isActive: true },
      select: { groupId: true },
    });
    const groupIds = groupStudents.map(g => g.groupId);

    const materials = await prisma.courseMaterial.findMany({
      where: {
        OR: [
          { groupId: { in: groupIds } }, // group-specific materials
          { groupId: null },              // materials shared with everyone
        ],
      },
      include: { group: true, teacher: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(materials);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

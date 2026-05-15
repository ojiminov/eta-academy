import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let groups;

    if (session.role === "STUDENT") {
      const student = await prisma.student.findFirst({ where: { userId: session.userId } });
      if (!student) return NextResponse.json([]);
      groups = await prisma.group.findMany({
        where: { groupStudents: { some: { studentId: student.id, isActive: true } }, isActive: true },
        include: { teacher: { include: { user: true } } },
      });
    } else if (session.role === "PARENT") {
      const parent = await prisma.parent.findFirst({ where: { userId: session.userId }, include: { student: true } });
      if (!parent) return NextResponse.json([]);
      groups = await prisma.group.findMany({
        where: { groupStudents: { some: { studentId: parent.studentId, isActive: true } }, isActive: true },
        include: { teacher: { include: { user: true } } },
      });
    } else {
      return NextResponse.json({ error: "Not applicable for this role" }, { status: 400 });
    }

    return NextResponse.json(groups);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

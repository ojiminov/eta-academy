import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: {
      teacher: { include: { user: true } },
      groupStudents: { where: { isActive: true }, select: { id: true } },
    },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, teacherId, level, schedule, maxStudents, startDate, monthlyFee } = await req.json();

    if (!name || !teacherId || !level || !schedule || !startDate || !monthlyFee) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        name,
        teacherId,
        level,
        schedule,
        maxStudents: maxStudents ? parseInt(maxStudents) : 12,
        startDate: new Date(startDate),
        monthlyFee: parseFloat(monthlyFee),
      },
      include: { teacher: { include: { user: true } } },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

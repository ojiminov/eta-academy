import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const exams = await prisma.exam.findMany({
      include: {
        group: true,
        teacher: { include: { user: true } },
        results: { include: { student: { include: { user: true } } } },
      },
      orderBy: { scheduledAt: "desc" },
    });
    return NextResponse.json(exams);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

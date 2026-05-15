import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Determine studentId
  let studentId: string | null = null;

  if (session.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    studentId = student?.id ?? null;
  }

  if (!studentId) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const [student, transactions] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        totalCoins: true,
        currentStreak: true,
        longestStreak: true,
        badge: true,
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.coinTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({ student, transactions });
}

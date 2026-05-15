import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // All-time leaderboard: top 20 by totalCoins
  const allTime = await prisma.student.findMany({
    where: { totalCoins: { gt: 0 } },
    orderBy: { totalCoins: "desc" },
    take: 20,
    select: {
      id: true,
      totalCoins: true,
      currentStreak: true,
      badge: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  // Most improved this month: sum coins earned in current month
  const monthlyRaw = await prisma.coinTransaction.groupBy({
    by: ["studentId"],
    where: { createdAt: { gte: startOfMonth } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 20,
  });

  // Enrich monthly with student info
  const studentIds = monthlyRaw.map(r => r.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: {
      id: true,
      totalCoins: true,
      badge: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });
  const studentMap = new Map(students.map(s => [s.id, s]));

  const monthly = monthlyRaw
    .map(r => ({
      ...studentMap.get(r.studentId),
      coinsThisMonth: r._sum.amount ?? 0,
    }))
    .filter(r => r.id);

  // Activity feed: last 30 coin transactions across all students
  const feed = await prisma.coinTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      student: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  return NextResponse.json({ allTime, monthly, feed });
}

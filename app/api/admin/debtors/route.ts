import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Only fetch students who actually have PENDING or OVERDUE payments
    const students = await prisma.student.findMany({
      where: { payments: { some: { status: { in: ["PENDING", "OVERDUE"] } } } },
      select: {
        id: true,
        balance: true,
        user: { select: { firstName: true, lastName: true, phone: true, email: true } },
        payments: {
          where: { status: { in: ["PENDING", "OVERDUE"] } },
          orderBy: { createdAt: "asc" },
          select: { id: true, amount: true, status: true, createdAt: true },
        },
        groupStudents: {
          where: { isActive: true },
          select: { group: { select: { name: true } } },
        },
      },
    });

    const debtors = students
      .map(s => {
        const totalOwed = s.payments.reduce((sum, p) => sum + p.amount, 0);
        const oldestPayment = s.payments[0];
        const daysPending = oldestPayment
          ? Math.floor((Date.now() - new Date(oldestPayment.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        return {
          id: s.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          phone: s.user.phone,
          email: s.user.email,
          totalOwed,
          pendingCount: s.payments.filter(p => p.status === "PENDING").length,
          overdueCount: s.payments.filter(p => p.status === "OVERDUE").length,
          daysPending,
          groups: s.groupStudents.map(gs => gs.group.name),
          balance: s.balance,
        };
      })
      .sort((a, b) => b.totalOwed - a.totalOwed);

    return NextResponse.json(debtors);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    // Get students with PENDING or OVERDUE payments
    const students = await prisma.student.findMany({
      include: {
        user: true,
        payments: {
          where: { status: { in: ["PENDING", "OVERDUE"] } },
          orderBy: { createdAt: "asc" },
        },
        groupStudents: {
          where: { isActive: true },
          include: { group: true },
        },
      },
    });

    const debtors = students
      .filter(s => s.payments.length > 0)
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

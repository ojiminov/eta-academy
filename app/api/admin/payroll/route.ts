import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // Get all teachers with their groups
  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
      groups: {
        include: {
          payments: {
            where: {
              status: "PAID",
              paidAt: { gte: startDate, lt: endDate },
            },
          },
        },
      },
      advances: {
        where: { date: { gte: startDate, lt: endDate } },
      },
      fines: {
        where: { date: { gte: startDate, lt: endDate } },
      },
    },
  });

  const payroll = teachers.map((teacher) => {
    const collectedRevenue = teacher.groups.reduce((sum, group) => {
      return sum + group.payments.reduce((s, p) => s + p.amount, 0);
    }, 0);

    const earned = collectedRevenue * (teacher.sharePercent / 100);
    const totalAdvances = teacher.advances.reduce((s, a) => s + a.amount, 0);
    const totalFines = teacher.fines.reduce((s, f) => s + f.amount, 0);
    const finalSalary = earned - totalAdvances - totalFines;

    return {
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        sharePercent: teacher.sharePercent,
      },
      collectedRevenue,
      earned,
      advances: totalAdvances,
      advanceList: teacher.advances,
      fines: totalFines,
      fineList: teacher.fines,
      finalSalary,
    };
  });

  // Staff salaries
  const staff = await prisma.staff.findMany({ orderBy: { name: "asc" } });

  return NextResponse.json({ month, year, payroll, staff });
}

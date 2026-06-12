import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: { include: { user: true } },
        invoice: { include: { group: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(payments);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { studentId, amount, cashAmount, cardAmount, method, notes, status, groupId, month, year } = await req.json();

    if (!studentId || !amount) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    const isPaid = status === "PAID" || !status;

    // If groupId not provided, infer from student's active group
    let resolvedGroupId = groupId || null;
    const now = new Date();
    const resolvedMonth = month || (now.getMonth() + 1);
    const resolvedYear = year || now.getFullYear();

    if (!resolvedGroupId) {
      const activeEnrollment = await prisma.groupStudent.findFirst({
        where: { studentId, isActive: true },
        select: { groupId: true },
      });
      resolvedGroupId = activeEnrollment?.groupId || null;
    }

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          studentId,
          amount: parsedAmount,
          cashAmount: cashAmount ? parseFloat(cashAmount) : null,
          cardAmount: cardAmount ? parseFloat(cardAmount) : null,
          method: method || "cash",
          notes: notes || null,
          status: isPaid ? "PAID" : (status || "PENDING"),
          paidAt: isPaid ? new Date() : null,
          groupId: resolvedGroupId,
          month: resolvedMonth,
          year: resolvedYear,
        },
        include: { student: { include: { user: true } } },
      }),
      // Deduct from student balance when payment is recorded as PAID
      ...(isPaid ? [prisma.student.update({
        where: { id: studentId },
        data: { balance: { decrement: parsedAmount } },
      })] : []),
    ]);

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status, method, notes } = await req.json();
    if (!id) return NextResponse.json({ error: "Payment ID required" }, { status: 400 });

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const becomingPaid = status === "PAID" && existing.status !== "PAID";

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        method,
        notes,
        paidAt: status === "PAID" ? new Date() : undefined,
      },
    });

    // Deduct balance if payment just became PAID
    if (becomingPaid) {
      await prisma.student.update({
        where: { id: existing.studentId },
        data: { balance: { decrement: existing.amount } },
      });
    }

    return NextResponse.json(payment);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

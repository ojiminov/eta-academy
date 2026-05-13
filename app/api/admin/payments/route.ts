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
    const { studentId, amount, method, notes, status } = await req.json();

    if (!studentId || !amount) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        method: method || "cash",
        notes: notes || null,
        status: status || "PAID",
        paidAt: status === "PAID" || !status ? new Date() : null,
      },
      include: { student: { include: { user: true } } },
    });

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

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        method,
        notes,
        paidAt: status === "PAID" ? new Date() : undefined,
      },
    });

    return NextResponse.json(payment);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

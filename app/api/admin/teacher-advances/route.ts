import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const advances = await prisma.teacherAdvance.findMany({
    include: { teacher: { include: { user: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(advances);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { teacherId, amount, reason, date } = await req.json();
  if (!teacherId || !amount) return NextResponse.json({ error: "teacherId and amount required" }, { status: 400 });

  const advance = await prisma.teacherAdvance.create({
    data: { teacherId, amount: Number(amount), reason, date: date ? new Date(date) : new Date() },
    include: { teacher: { include: { user: true } } },
  });
  return NextResponse.json(advance, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.teacherAdvance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

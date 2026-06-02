import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const { title, description, scheduledAt, duration, maxScore } = await req.json();
    const exam = await prisma.exam.update({
      where: { id },
      data: {
        title,
        description: description || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        duration: duration ? parseInt(duration) : null,
        maxScore: maxScore ? parseFloat(maxScore) : undefined,
      },
      include: { group: true, teacher: { include: { user: true } }, results: true },
    });
    return NextResponse.json(exam);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.examResult.deleteMany({ where: { examId: id } });
    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

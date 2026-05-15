import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN","TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { results } = await req.json();
    await Promise.all(
      results.map((r: { studentId: string; score?: number; feedback?: string }) =>
        prisma.examResult.updateMany({
          where: { examId: id, studentId: r.studentId },
          data: { score: r.score ?? undefined, feedback: r.feedback ?? undefined, gradedAt: r.score != null ? new Date() : undefined, updatedAt: new Date() },
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

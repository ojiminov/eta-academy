import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { awardExamCoins } from "@/lib/coins";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN","TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { results } = await req.json();

    // Fetch exam maxScore and existing results to avoid double-awarding
    const exam = await prisma.exam.findUnique({ where: { id }, select: { maxScore: true } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const existingResults = await prisma.examResult.findMany({
      where: { examId: id },
      select: { studentId: true, score: true },
    });
    const existingMap = new Map(existingResults.map(r => [r.studentId, r.score]));

    await Promise.all(
      results.map((r: { studentId: string; score?: number; feedback?: string }) =>
        prisma.examResult.updateMany({
          where: { examId: id, studentId: r.studentId },
          data: {
            score: r.score ?? undefined,
            feedback: r.feedback ?? undefined,
            gradedAt: r.score != null ? new Date() : undefined,
            updatedAt: new Date(),
          },
        })
      )
    );

    // Award coins for newly scored exams (fire-and-forget)
    for (const r of results) {
      if (r.score != null && existingMap.get(r.studentId) == null) {
        awardExamCoins(r.studentId, id, r.score, exam.maxScore).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { awardHomeworkCoins } from "@/lib/coins";

export const dynamic = "force-dynamic";

// PATCH /api/teacher/homeworks/[id]/grades  — bulk update grades for a homework
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { grades } = await req.json(); // [{studentId, score, feedback, status}]
    if (!Array.isArray(grades)) {
      return NextResponse.json({ error: "grades must be an array" }, { status: 400 });
    }

    // Fetch homework to validate maxScore
    const homework = await prisma.homework.findUnique({ where: { id }, select: { maxScore: true } });
    if (!homework) return NextResponse.json({ error: "Homework not found" }, { status: 404 });

    // Fetch existing grades to detect new score assignments (avoid double-awarding)
    const existingGrades = await prisma.homeworkGrade.findMany({
      where: { homeworkId: id },
      select: { studentId: true, score: true },
    });
    const existingMap = new Map(existingGrades.map(g => [g.studentId, g.score]));

    const updates = await Promise.all(
      grades.map((g: { studentId: string; score?: number; feedback?: string; status?: string }) => {
        if (g.score != null && (g.score < 0 || g.score > homework.maxScore)) {
          throw new Error(`Score ${g.score} exceeds maxScore ${homework.maxScore}`);
        }
        return prisma.homeworkGrade.updateMany({
          where: { homeworkId: id, studentId: g.studentId },
          data: {
            score: g.score ?? undefined,
            feedback: g.feedback ?? undefined,
            status: (g.status as "ASSIGNED"|"SUBMITTED"|"GRADED"|"LATE") ?? undefined,
            gradedAt: g.score != null ? new Date() : undefined,
            updatedAt: new Date(),
          },
        });
      })
    );

    // Award coins for newly graded homework (fire-and-forget, no score was set before)
    for (const g of grades) {
      if (g.score != null && existingMap.get(g.studentId) == null) {
        awardHomeworkCoins(g.studentId, id, g.score, homework.maxScore).catch(() => {});
      }
    }

    return NextResponse.json({ updated: updates.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

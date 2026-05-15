import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    const updates = await Promise.all(
      grades.map((g: { studentId: string; score?: number; feedback?: string; status?: string }) =>
        prisma.homeworkGrade.updateMany({
          where: { homeworkId: id, studentId: g.studentId },
          data: {
            score: g.score ?? undefined,
            feedback: g.feedback ?? undefined,
            status: (g.status as "ASSIGNED"|"SUBMITTED"|"GRADED"|"LATE") ?? undefined,
            gradedAt: g.score != null ? new Date() : undefined,
            updatedAt: new Date(),
          },
        })
      )
    );
    return NextResponse.json({ updated: updates.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

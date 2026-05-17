// ─── Server-only: Prisma coin engine ─────────────────────────────────────────
// DO NOT import this file in "use client" components.
// Client components should import from @/lib/coins-shared instead.

import { prisma } from "@/lib/prisma";
import { COIN_VALUES, BADGE_THRESHOLDS, getBadgeTier } from "@/lib/coins-shared";

export { COIN_VALUES, BADGE_THRESHOLDS, getBadgeTier } from "@/lib/coins-shared";
export { BADGE_ICONS, BADGE_COLORS } from "@/lib/coins-shared";

type CoinType = "ATTENDANCE" | "HOMEWORK" | "EXAM" | "STREAK" | "BONUS";
type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "HOLIDAY" | "HW_NOT_DONE";

// ─── Core award function ──────────────────────────────────────────────────────

export async function awardCoins({
  studentId,
  amount,
  type,
  reason,
  refId,
}: {
  studentId: string;
  amount: number;
  type: CoinType;
  reason: string;
  refId?: string;
}): Promise<void> {
  if (amount <= 0) return;

  await prisma.$transaction(async (tx) => {
    await (tx as any).coinTransaction.create({
      data: { studentId, amount, type, reason, refId },
    });

    const updated = await (tx as any).student.update({
      where: { id: studentId },
      data: { totalCoins: { increment: amount } },
      select: { totalCoins: true },
    });

    const badge = getBadgeTier(updated.totalCoins);
    await (tx as any).student.update({
      where: { id: studentId },
      data: { badge },
    });
  });
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function updateStreak(studentId: string): Promise<{ newStreak: number; bonusAwarded: boolean }> {
  const student = await (prisma as any).student.findUnique({
    where: { id: studentId },
    select: { currentStreak: true, longestStreak: true },
  });
  if (!student) return { newStreak: 0, bonusAwarded: false };

  const newStreak = student.currentStreak + 1;
  const newLongest = Math.max(newStreak, student.longestStreak);

  await (prisma as any).student.update({
    where: { id: studentId },
    data: { currentStreak: newStreak, longestStreak: newLongest },
  });

  let bonusAwarded = false;
  if (newStreak === 7) {
    await awardCoins({ studentId, amount: COIN_VALUES.STREAK_7, type: "STREAK", reason: "7-day attendance streak! 🔥", refId: studentId });
    bonusAwarded = true;
  } else if (newStreak === 30) {
    await awardCoins({ studentId, amount: COIN_VALUES.STREAK_30, type: "STREAK", reason: "30-day attendance streak! 🏆", refId: studentId });
    bonusAwarded = true;
  }

  return { newStreak, bonusAwarded };
}

export async function breakStreak(studentId: string): Promise<void> {
  await (prisma as any).student.update({
    where: { id: studentId },
    data: { currentStreak: 0 },
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function awardAttendanceCoins(
  studentId: string,
  status: AttendanceStatus,
  sessionId: string
): Promise<void> {
  if (status === "PRESENT") {
    await awardCoins({ studentId, amount: COIN_VALUES.PRESENT, type: "ATTENDANCE", reason: "Attended class ✅", refId: sessionId });
    await updateStreak(studentId);
  } else if (status === "LATE") {
    await awardCoins({ studentId, amount: COIN_VALUES.LATE, type: "ATTENDANCE", reason: "Attended class (late) ⏰", refId: sessionId });
  } else {
    await breakStreak(studentId);
  }
}

// ─── Homework ─────────────────────────────────────────────────────────────────

export async function awardHomeworkCoins(
  studentId: string,
  homeworkId: string,
  score: number | null | undefined,
  maxScore: number
): Promise<void> {
  await awardCoins({ studentId, amount: COIN_VALUES.HW_SUBMIT, type: "HOMEWORK", reason: "Submitted homework 📝", refId: homeworkId });

  if (score != null && maxScore > 0) {
    const pct = score / maxScore;
    if (pct >= 1.0)      await awardCoins({ studentId, amount: 35, type: "HOMEWORK", reason: "Perfect homework score! 💯", refId: homeworkId });
    else if (pct >= 0.9) await awardCoins({ studentId, amount: 26, type: "HOMEWORK", reason: "Excellent homework score ⭐", refId: homeworkId });
    else if (pct >= 0.8) await awardCoins({ studentId, amount: 18, type: "HOMEWORK", reason: "Great homework score ⭐", refId: homeworkId });
    else if (pct >= 0.7) await awardCoins({ studentId, amount: 9,  type: "HOMEWORK", reason: "Good homework score ⭐", refId: homeworkId });
  }
}

// ─── Exam ─────────────────────────────────────────────────────────────────────

export async function awardExamCoins(
  studentId: string,
  examId: string,
  score: number,
  maxScore: number
): Promise<void> {
  if (maxScore <= 0) return;
  const coins = Math.round((score / maxScore) * COIN_VALUES.EXAM_MAX);
  if (coins > 0) {
    const pct = Math.round((score / maxScore) * 100);
    await awardCoins({ studentId, amount: coins, type: "EXAM", reason: `Exam result: ${pct}% 🧪`, refId: examId });
  }
}

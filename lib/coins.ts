import { prisma } from "@/lib/prisma";
import { CoinType, AttendanceStatus } from "@prisma/client";

// ─── Coin award values ────────────────────────────────────────────────────────

export const COIN_VALUES = {
  // Attendance
  PRESENT: 20,
  LATE: 8,
  // Homework submission (base)
  HW_SUBMIT: 15,
  // Homework score bonus (per 10% above 60%)  → max +35 at 100%
  HW_SCORE_PER_10PCT: 8.75, // 4 tiers × 8.75 = 35
  // Exam score bonus (proportional, max 80 coins at 100%)
  EXAM_MAX: 80,
  // Streak bonuses
  STREAK_7: 60,
  STREAK_30: 150,
} as const;

// Badge thresholds (totalCoins)
export const BADGE_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  PLATINUM: 4000,
} as const;

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
    // 1. Log the transaction
    await tx.coinTransaction.create({
      data: { studentId, amount, type, reason, refId },
    });

    // 2. Increment totalCoins
    const updated = await tx.student.update({
      where: { id: studentId },
      data: { totalCoins: { increment: amount } },
      select: { totalCoins: true },
    });

    // 3. Recalculate badge tier
    const badge = getBadgeTier(updated.totalCoins);
    await tx.student.update({
      where: { id: studentId },
      data: { badge },
    });
  });
}

// ─── Streak update ────────────────────────────────────────────────────────────

export async function updateStreak(studentId: string): Promise<{ newStreak: number; bonusAwarded: boolean }> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { currentStreak: true, longestStreak: true },
  });
  if (!student) return { newStreak: 0, bonusAwarded: false };

  const newStreak = student.currentStreak + 1;
  const newLongest = Math.max(newStreak, student.longestStreak);

  await prisma.student.update({
    where: { id: studentId },
    data: { currentStreak: newStreak, longestStreak: newLongest },
  });

  // Award streak milestones (only once each)
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
  await prisma.student.update({
    where: { id: studentId },
    data: { currentStreak: 0 },
  });
}

// ─── Attendance coins ─────────────────────────────────────────────────────────

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
    // ABSENT / EXCUSED → break streak
    await breakStreak(studentId);
  }
}

// ─── Homework coins ───────────────────────────────────────────────────────────

export async function awardHomeworkCoins(
  studentId: string,
  homeworkId: string,
  score: number | null | undefined,
  maxScore: number
): Promise<void> {
  // Base submit reward
  await awardCoins({ studentId, amount: COIN_VALUES.HW_SUBMIT, type: "HOMEWORK", reason: "Submitted homework 📝", refId: homeworkId });

  // Score bonus: each 10% above 60% earns COIN_VALUES.HW_SCORE_PER_10PCT (up to 4 tiers)
  if (score != null && maxScore > 0) {
    const pct = score / maxScore;
    if (pct >= 1.0) {
      await awardCoins({ studentId, amount: 35, type: "HOMEWORK", reason: "Perfect homework score! 💯", refId: homeworkId });
    } else if (pct >= 0.9) {
      await awardCoins({ studentId, amount: 26, type: "HOMEWORK", reason: "Excellent homework score ⭐", refId: homeworkId });
    } else if (pct >= 0.8) {
      await awardCoins({ studentId, amount: 18, type: "HOMEWORK", reason: "Great homework score ⭐", refId: homeworkId });
    } else if (pct >= 0.7) {
      await awardCoins({ studentId, amount: 9, type: "HOMEWORK", reason: "Good homework score ⭐", refId: homeworkId });
    }
  }
}

// ─── Exam coins ───────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getBadgeTier(totalCoins: number): "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" {
  if (totalCoins >= BADGE_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (totalCoins >= BADGE_THRESHOLDS.GOLD) return "GOLD";
  if (totalCoins >= BADGE_THRESHOLDS.SILVER) return "SILVER";
  return "BRONZE";
}

export const BADGE_ICONS: Record<string, string> = {
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD: "🥇",
  PLATINUM: "💎",
};

export const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  BRONZE:   { bg: "#fef0e7", color: "#c2410c" },
  SILVER:   { bg: "#f1f5f9", color: "#475569" },
  GOLD:     { bg: "#fef9c3", color: "#a16207" },
  PLATINUM: { bg: "#ede9fe", color: "#6d28d9" },
};

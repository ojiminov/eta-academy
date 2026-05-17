// ─── Client-safe constants (no Prisma, no server imports) ────────────────────

export const COIN_VALUES = {
  PRESENT: 20,
  LATE: 8,
  HW_SUBMIT: 15,
  EXAM_MAX: 80,
  STREAK_7: 60,
  STREAK_30: 150,
} as const;

export const BADGE_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  PLATINUM: 4000,
} as const;

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

export function getBadgeTier(totalCoins: number): "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" {
  if (totalCoins >= BADGE_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (totalCoins >= BADGE_THRESHOLDS.GOLD) return "GOLD";
  if (totalCoins >= BADGE_THRESHOLDS.SILVER) return "SILVER";
  return "BRONZE";
}

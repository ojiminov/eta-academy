"use client";

import { useEffect, useState } from "react";
import { BADGE_ICONS, BADGE_COLORS } from "@/lib/coins-shared";

type LeaderEntry = {
  id: string;
  totalCoins: number;
  currentStreak?: number;
  badge: string;
  user: { firstName: string; lastName: string };
  coinsThisMonth?: number;
};

type FeedEntry = {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
  student: { user: { firstName: string; lastName: string } };
};

const COIN_TYPE_ICONS: Record<string, string> = {
  ATTENDANCE: "✅",
  HOMEWORK: "📝",
  EXAM: "🧪",
  STREAK: "🔥",
  BONUS: "🎁",
};

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"alltime" | "monthly">("monthly");
  const [allTime, setAllTime] = useState<LeaderEntry[]>([]);
  const [monthly, setMonthly] = useState<LeaderEntry[]>([]);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => { setAllTime(d.allTime || []); setMonthly(d.monthly || []); setFeed(d.feed || []); })
      .finally(() => setLoading(false));
  }, []);

  const list = tab === "alltime" ? allTime : monthly;

  const medalStyle = (i: number) => {
    if (i === 0) return { bg: "#fef3c7", color: "#d97706", border: "2px solid #fbbf24" };
    if (i === 1) return { bg: "#f1f5f9", color: "#475569", border: "2px solid #94a3b8" };
    if (i === 2) return { bg: "#fef0e7", color: "#c2410c", border: "2px solid #fb923c" };
    return { bg: "white", color: "#64748b", border: "1px solid #e2e8f0" };
  };

  const medalEmoji = (i: number) => ["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`;

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#1e293b", margin: "0 0 0.5rem" }}>
          🏆 Academy Leaderboard
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>See who's earning the most coins and climbing the ranks</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Leaderboard */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {[
              { key: "monthly", label: "⬆️ Most Improved This Month" },
              { key: "alltime", label: "🏆 All-Time Champions" },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as "alltime" | "monthly")} style={{
                padding: "0.5rem 1.25rem", borderRadius: "9999px", border: "2px solid",
                borderColor: tab === t.key ? "var(--primary, #6366f1)" : "#e2e8f0",
                background: tab === t.key ? "var(--primary, #6366f1)" : "white",
                color: tab === t.key ? "white" : "#475569",
                fontWeight: "600", fontSize: "0.875rem", cursor: "pointer",
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading...</div>
          ) : list.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🏆</div>
              <div style={{ fontWeight: "600", color: "#1e293b" }}>No rankings yet</div>
              <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Students earn coins through attendance, homework, and exams</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {list.map((entry, i) => {
                const medal = medalStyle(i);
                const badge = BADGE_ICONS[entry.badge] || "🥉";
                const badgeColor = BADGE_COLORS[entry.badge] || BADGE_COLORS.BRONZE;
                const coins = tab === "monthly" ? (entry.coinsThisMonth ?? 0) : entry.totalCoins;

                return (
                  <div key={entry.id} style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1rem 1.25rem", borderRadius: "0.75rem",
                    background: medal.bg, border: medal.border,
                    boxShadow: i < 3 ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  }}>
                    {/* Rank */}
                    <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: i < 3 ? "1.4rem" : "0.9rem", fontWeight: "800", color: medal.color, flexShrink: 0 }}>
                      {medalEmoji(i)}
                    </div>

                    {/* Name + badge */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.95rem" }}>
                          {entry.user.firstName} {entry.user.lastName}
                        </span>
                        <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "700", background: badgeColor.bg, color: badgeColor.color }}>
                          {badge} {entry.badge}
                        </span>
                      </div>
                      {entry.currentStreak != null && entry.currentStreak > 0 && (
                        <div style={{ fontSize: "0.75rem", color: "#f97316", fontWeight: "600" }}>
                          🔥 {entry.currentStreak}-day streak
                        </div>
                      )}
                    </div>

                    {/* Coins */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--primary, #6366f1)" }}>
                        {coins.toLocaleString()}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        {tab === "monthly" ? "coins this month" : "total coins"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "0.75rem", fontSize: "1rem" }}>
            ⚡ Academy Activity Feed
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden", maxHeight: "600px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
            ) : feed.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
                <div>No activity yet</div>
              </div>
            ) : (
              feed.map((item, i) => (
                <div key={item.id} style={{
                  padding: "0.75rem 1rem", borderBottom: i < feed.length - 1 ? "1px solid #f1f5f9" : "none",
                  display: "flex", gap: "0.75rem", alignItems: "flex-start",
                }}>
                  <div style={{ fontSize: "1.3rem", flexShrink: 0, marginTop: "0.1rem" }}>
                    {COIN_TYPE_ICONS[item.type] || "🎯"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.8rem" }}>
                      {item.student.user.firstName} {item.student.user.lastName}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.1rem" }}>{item.reason}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.7rem", marginTop: "0.2rem" }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontWeight: "800", color: "#10b981", fontSize: "0.85rem", flexShrink: 0 }}>
                    +{item.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

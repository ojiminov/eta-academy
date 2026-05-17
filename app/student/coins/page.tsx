"use client";

import { useEffect, useState } from "react";
import { BADGE_ICONS, BADGE_COLORS, BADGE_THRESHOLDS } from "@/lib/coins-shared";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
};

type StudentProfile = {
  id: string;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  badge: string;
  user: { firstName: string; lastName: string };
};

const TYPE_ICONS: Record<string, string> = {
  ATTENDANCE: "✅",
  HOMEWORK: "📝",
  EXAM: "🧪",
  STREAK: "🔥",
  BONUS: "🎁",
};

const TYPE_COLORS: Record<string, string> = {
  ATTENDANCE: "#10b981",
  HOMEWORK: "#6366f1",
  EXAM: "#f59e0b",
  STREAK: "#f97316",
  BONUS: "#ec4899",
};

const BADGE_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;

function nextBadgeInfo(badge: string, totalCoins: number) {
  const idx = BADGE_ORDER.indexOf(badge as typeof BADGE_ORDER[number]);
  if (idx === BADGE_ORDER.length - 1) return null;
  const nextBadge = BADGE_ORDER[idx + 1];
  const needed = BADGE_THRESHOLDS[nextBadge];
  const progress = Math.min((totalCoins / needed) * 100, 100);
  return { nextBadge, needed, progress };
}

export default function CoinsPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/coins")
      .then(r => r.json())
      .then(d => { setProfile(d.student); setTransactions(d.transactions || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading...</div>;
  if (!profile) return <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>Could not load your profile.</div>;

  const badgeInfo = BADGE_COLORS[profile.badge] || BADGE_COLORS.BRONZE;
  const badgeIcon = BADGE_ICONS[profile.badge] || "🥉";
  const next = nextBadgeInfo(profile.badge, profile.totalCoins);

  // Compute coins by type for breakdown
  const byType = transactions.reduce<Record<string, number>>((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + t.amount;
    return acc;
  }, {});

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Profile card */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        borderRadius: "1.25rem", padding: "2rem", marginBottom: "1.5rem",
        color: "white", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: "0.25rem" }}>Student Profile</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "800" }}>
              {profile.user.firstName} {profile.user.lastName}
            </div>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", padding: "0.375rem 0.875rem", borderRadius: "9999px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
              <span style={{ fontSize: "1.1rem" }}>{badgeIcon}</span>
              <span style={{ fontWeight: "700", fontSize: "0.875rem" }}>{profile.badge} MEMBER</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "900", lineHeight: 1 }}>{profile.totalCoins.toLocaleString()}</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>total coins</div>
          </div>
        </div>

        {/* Streak row */}
        <div style={{ display: "flex", gap: "2rem", marginTop: "1.25rem", position: "relative" }}>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "800" }}>🔥 {profile.currentStreak}</div>
            <div style={{ fontSize: "0.7rem", opacity: 0.75 }}>Current streak</div>
          </div>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "800" }}>⚡ {profile.longestStreak}</div>
            <div style={{ fontSize: "0.7rem", opacity: 0.75 }}>Longest streak</div>
          </div>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "800" }}>📋 {transactions.length}</div>
            <div style={{ fontSize: "0.7rem", opacity: 0.75 }}>Transactions</div>
          </div>
        </div>

        {/* Progress to next badge */}
        {next && (
          <div style={{ marginTop: "1.25rem", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", opacity: 0.85, marginBottom: "0.375rem" }}>
              <span>Progress to {BADGE_ICONS[next.nextBadge]} {next.nextBadge}</span>
              <span>{profile.totalCoins.toLocaleString()} / {next.needed.toLocaleString()} coins</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${next.progress}%`, background: "white", borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Coin breakdown by type */}
        <div className="card">
          <h3 style={{ fontWeight: "700", color: "#1e293b", marginBottom: "1rem", fontSize: "0.95rem" }}>📊 Coins by Source</h3>
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, total]) => {
            const max = Math.max(...Object.values(byType));
            return (
              <div key={type} style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.8rem" }}>
                  <span>{TYPE_ICONS[type] || "🎯"} {type.charAt(0) + type.slice(1).toLowerCase()}</span>
                  <span style={{ fontWeight: "700", color: TYPE_COLORS[type] || "#6366f1" }}>{total}</span>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(total / max) * 100}%`, background: TYPE_COLORS[type] || "#6366f1", borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
          {Object.keys(byType).length === 0 && (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "1rem 0" }}>No coins yet — attend class to start earning!</div>
          )}
        </div>

        {/* Badge roadmap */}
        <div className="card">
          <h3 style={{ fontWeight: "700", color: "#1e293b", marginBottom: "1rem", fontSize: "0.95rem" }}>🏅 Badge Roadmap</h3>
          {BADGE_ORDER.map(b => {
            const bc = BADGE_COLORS[b];
            const bi = BADGE_ICONS[b];
            const threshold = BADGE_THRESHOLDS[b];
            const achieved = profile.totalCoins >= threshold;
            const isCurrent = profile.badge === b;
            return (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", marginBottom: "0.375rem", background: isCurrent ? bc.bg : achieved ? "#f8fafc" : "transparent", border: isCurrent ? `2px solid ${bc.color}` : "2px solid transparent" }}>
                <span style={{ fontSize: "1.25rem" }}>{bi}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "700", color: achieved ? bc.color : "#94a3b8", fontSize: "0.875rem" }}>{b}</div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{threshold === 0 ? "Starting tier" : `${threshold.toLocaleString()}+ coins`}</div>
                </div>
                {achieved && <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "700" }}>✓ Achieved</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction history */}
      <div className="card" style={{ marginTop: "1.5rem", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", fontWeight: "700", color: "#1e293b", fontSize: "0.95rem" }}>
          ⚡ Coin History
        </div>
        {transactions.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
            <div>No transactions yet</div>
          </div>
        ) : (
          transactions.map((t, i) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 1.25rem", borderBottom: i < transactions.length - 1 ? "1px solid #f8fafc" : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${TYPE_COLORS[t.type] || "#6366f1"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                {TYPE_ICONS[t.type] || "🎯"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.85rem" }}>{t.reason}</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ fontWeight: "800", color: "#10b981", fontSize: "0.95rem" }}>+{t.amount}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

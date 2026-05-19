import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const student = user?.student;

  const [groups, recentGrades, pendingPayments, pendingHomework] = student
    ? await Promise.all([
        prisma.groupStudent.findMany({
          where: { studentId: student.id, isActive: true },
          include: { group: { include: { teacher: { include: { user: true } } } } },
        }),
        prisma.grade.findMany({
          where: { studentId: student.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.payment.count({ where: { studentId: student.id, status: "PENDING" } }),
        prisma.homeworkGrade.count({ where: { studentId: student.id, status: { in: ["ASSIGNED", "LATE"] } } }),
      ])
    : [[], [], 0, 0];

  const avgScore = recentGrades.length > 0
    ? Math.round(recentGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / recentGrades.length)
    : null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const badgeEmoji = student?.badge === "PLATINUM" ? "💎" : student?.badge === "GOLD" ? "🥇" : student?.badge === "SILVER" ? "🥈" : "🥉";

  return (
    <div style={{ padding: "0", maxWidth: "100%" }}>

      {/* Hero banner */}
      <div style={{
        background: student && student.balance < 0
          ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
          : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
        padding: "2rem 2.5rem 3.5rem",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: "-60px", right: "120px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.875rem", margin: "0 0 0.375rem", fontWeight: "500" }}>{today}</p>
          <h1 style={{ color: "white", fontSize: "1.875rem", fontWeight: "800", margin: "0 0 0.375rem", letterSpacing: "-0.025em" }}>
            {t("dashboard.studentTitle", { name: user?.firstName ?? "" })} 🎓
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.9rem" }}>{t("dashboard.studentSubtitle")}</p>

          {/* Balance + alerts */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            {student && (
              <Link href="/student/payments" style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
                color: "white", textDecoration: "none", padding: "0.4rem 0.875rem",
                borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "600",
                border: "1px solid rgba(255,255,255,0.25)",
              }}>
                💰 Balance: {student.balance.toLocaleString()} UZS
              </Link>
            )}
            {pendingPayments > 0 && (
              <Link href="/student/payments" style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                background: "rgba(239,68,68,0.25)", backdropFilter: "blur(8px)",
                color: "white", textDecoration: "none", padding: "0.4rem 0.875rem",
                borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "600",
                border: "1px solid rgba(239,68,68,0.4)",
              }}>
                ⚠️ {pendingPayments} pending payment{pendingPayments > 1 ? "s" : ""}
              </Link>
            )}
            {pendingHomework > 0 && (
              <Link href="/student/homework" style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                background: "rgba(245,158,11,0.25)", backdropFilter: "blur(8px)",
                color: "white", textDecoration: "none", padding: "0.4rem 0.875rem",
                borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "600",
                border: "1px solid rgba(245,158,11,0.4)",
              }}>
                📋 {pendingHomework} homework due
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards — overlap the banner */}
      <div style={{ padding: "0 2rem", marginTop: "-1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[
            { label: t("dashboard.myClasses"), value: groups.length, sub: "enrolled", color: "#6366f1", light: "#ede9fe" },
            { label: t("dashboard.avgScore"), value: avgScore !== null ? `${avgScore}%` : "—", sub: "recent avg", color: "#10b981", light: "#d1fae5" },
            { label: "Pending HW", value: pendingHomework, sub: "to complete", color: pendingHomework > 0 ? "#f59e0b" : "#64748b", light: pendingHomework > 0 ? "#fef3c7" : "#f1f5f9" },
            { label: t("dashboard.pendingPayments"), value: pendingPayments, sub: "awaiting", color: pendingPayments > 0 ? "#ef4444" : "#64748b", light: pendingPayments > 0 ? "#fee2e2" : "#f1f5f9" },
          ].map((card) => (
            <div key={card.label} style={{
              background: "white", borderRadius: "1rem", padding: "1.375rem 1.5rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: card.color }} />
              <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", background: card.light, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: card.color }} />
              </div>
              <div style={{ fontSize: "2.25rem", fontWeight: "800", color: "#0f172a", lineHeight: 1, letterSpacing: "-0.025em" }}>{card.value}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</div>
              <div style={{ fontSize: "0.72rem", color: "#cbd5e1", marginTop: "0.125rem" }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Coins / badge banner */}
      {student && (
        <div style={{ padding: "1.25rem 2rem 0" }}>
          <Link href="/student/coins" style={{ textDecoration: "none", display: "block" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem", background: "white", border: "1px solid #e9d5ff", borderRadius: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "1.875rem" }}>{badgeEmoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", color: "#6d28d9", fontSize: "0.9375rem" }}>{student.badge} Member</div>
                <div style={{ color: "#8b5cf6", fontSize: "0.78rem" }}>{(student.totalCoins ?? 0).toLocaleString()} coins earned · {student.currentStreak ?? 0}-day streak 🔥</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </Link>
        </div>
      )}

      {/* My classes + Recent grades */}
      <div style={{ padding: "1.25rem 2rem 2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* My classes */}
        <div style={{ background: "white", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("dashboard.myClasses")}</h2>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.125rem 0 0" }}>Your enrolled groups</p>
          </div>
          {groups.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📚</div>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{t("groups.noGroupsAssigned")}</div>
            </div>
          ) : (
            <div>
              {groups.map((gs, i) => (
                <div key={gs.id} style={{ padding: "0.875rem 1.5rem", borderBottom: i < groups.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>{gs.group.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.125rem" }}>
                    👨‍🏫 {gs.group.teacher.user.firstName} {gs.group.teacher.user.lastName} · 🕐 {gs.group.schedule}
                  </div>
                  <span style={{ display: "inline-flex", marginTop: "0.375rem", padding: "0.1rem 0.5rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: "600", background: "#dbeafe", color: "#1e40af" }}>
                    {t(`levels.${gs.group.level}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent grades */}
        <div style={{ background: "white", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("dashboard.recentGrades")}</h2>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.125rem 0 0" }}>Latest assessments</p>
            </div>
            <Link href="/student/grades" style={{ fontSize: "0.78rem", color: "var(--primary, #6366f1)", fontWeight: "600", textDecoration: "none", padding: "0.375rem 0.75rem", background: "#f5f3ff", borderRadius: "0.5rem", border: "1px solid #e0e7ff" }}>
              View all
            </Link>
          </div>
          {recentGrades.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📝</div>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{t("grades.noGrades")}</div>
            </div>
          ) : (
            <div>
              {recentGrades.map((g, i) => {
                const pct = Math.round((g.score / g.maxScore) * 100);
                const style = pct >= 80 ? { bg: "#dcfce7", color: "#16a34a" } : pct >= 60 ? { bg: "#fef9c3", color: "#ca8a04" } : { bg: "#fee2e2", color: "#dc2626" };
                return (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.5rem", borderBottom: i < recentGrades.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>{g.label || t("grades.assignment")}</div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        {new Date(g.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <span style={{ display: "inline-flex", padding: "0.2rem 0.625rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: "700", background: style.bg, color: style.color, flexShrink: 0 }}>
                      {g.score}/{g.maxScore} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

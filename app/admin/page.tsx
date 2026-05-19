import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

async function getStats() {
  const [students, teachers, groups, payments] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.group.count({ where: { isActive: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
  ]);
  const recentPayments = await prisma.payment.findMany({
    take: 6, orderBy: { createdAt: "desc" },
    include: { student: { include: { user: true } } },
  });
  const pendingPayments = await prisma.payment.count({ where: { status: "PENDING" } });
  const overduePayments = await prisma.payment.count({ where: { status: "OVERDUE" } });
  const activeStudents = await prisma.student.count({ where: { user: { isActive: true } } });
  return { students, teachers, groups, totalRevenue: payments._sum.amount || 0, recentPayments, pendingPayments, overduePayments, activeStudents };
}

const AVATAR_COLORS = ["#6366f1","#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316"];
function avatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const t = await getTranslations();

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ padding: "0", maxWidth: "100%" }}>

      {/* Hero banner */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary, #6366f1) 0%, #8b5cf6 50%, #a78bfa 100%)",
        padding: "2rem 2.5rem 3.5rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: "-60px", right: "120px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.875rem", margin: "0 0 0.375rem", fontWeight: "500" }}>{today}</p>
          <h1 style={{ color: "white", fontSize: "1.875rem", fontWeight: "800", margin: "0 0 0.375rem", letterSpacing: "-0.025em" }}>
            {t("dashboard.adminTitle")} 👋
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.9rem" }}>{t("dashboard.adminSubtitle")}</p>

          {/* Alert banners */}
          {(stats.pendingPayments > 0 || stats.overduePayments > 0) && (
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              {stats.pendingPayments > 0 && (
                <Link href="/admin/payments" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
                  color: "white", textDecoration: "none", padding: "0.4rem 0.875rem",
                  borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "600",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}>
                  ⏳ {stats.pendingPayments} pending payment{stats.pendingPayments > 1 ? "s" : ""}
                </Link>
              )}
              {stats.overduePayments > 0 && (
                <Link href="/admin/debtors" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  background: "rgba(239,68,68,0.25)", backdropFilter: "blur(8px)",
                  color: "white", textDecoration: "none", padding: "0.4rem 0.875rem",
                  borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "600",
                  border: "1px solid rgba(239,68,68,0.4)",
                }}>
                  ⚠️ {stats.overduePayments} overdue
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stat cards — overlap the banner */}
      <div style={{ padding: "0 2rem", marginTop: "-1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[
            { label: t("dashboard.totalStudents"), value: stats.students, sub: `${stats.activeStudents} active`, color: "#6366f1", light: "#ede9fe" },
            { label: t("dashboard.totalTeachers"), value: stats.teachers, sub: "on staff", color: "#10b981", light: "#d1fae5" },
            { label: t("dashboard.activeGroups"), value: stats.groups, sub: "running now", color: "#f59e0b", light: "#fef3c7" },
            { label: t("dashboard.totalRevenue"), value: `${(stats.totalRevenue / 1_000_000).toFixed(1)}M`, sub: "UZS collected", color: "#3b82f6", light: "#dbeafe" },
          ].map((card) => (
            <div key={card.label} style={{
              background: "white",
              borderRadius: "1rem",
              padding: "1.375rem 1.5rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                background: card.color,
              }} />
              <div style={{
                width: "44px", height: "44px", borderRadius: "0.75rem",
                background: card.light, display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: "1rem",
              }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: card.color }} />
              </div>
              <div style={{ fontSize: "2.25rem", fontWeight: "800", color: "#0f172a", lineHeight: 1, letterSpacing: "-0.025em" }}>
                {card.value}
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {card.label}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#cbd5e1", marginTop: "0.125rem" }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content grid */}
      <div style={{ padding: "1.5rem 2rem 2rem", display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem" }}>

        {/* Recent payments */}
        <div style={{ background: "white", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("dashboard.recentPayments")}</h2>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.125rem 0 0" }}>Latest transactions</p>
            </div>
            <Link href="/admin/payments" style={{
              fontSize: "0.78rem", color: "var(--primary, #6366f1)", fontWeight: "600",
              textDecoration: "none", padding: "0.375rem 0.75rem",
              background: "#f5f3ff", borderRadius: "0.5rem", border: "1px solid #e0e7ff",
            }}>
              View all
            </Link>
          </div>

          {stats.recentPayments.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>💳</div>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{t("dashboard.noPayments")}</div>
            </div>
          ) : (
            <div>
              {stats.recentPayments.map((p, i) => {
                const name = `${p.student.user.firstName} ${p.student.user.lastName}`;
                const color = avatarColor(name);
                const statusStyle = p.status === "PAID"
                  ? { bg: "#dcfce7", color: "#16a34a" }
                  : p.status === "PENDING"
                  ? { bg: "#fef9c3", color: "#ca8a04" }
                  : { bg: "#fee2e2", color: "#dc2626" };
                return (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "0.875rem 1.5rem",
                    borderBottom: i < stats.recentPayments.length - 1 ? "1px solid #f8fafc" : "none",
                  }}>
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "50%", background: color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontSize: "0.75rem", fontWeight: "700", flexShrink: 0,
                    }}>
                      {`${p.student.user.firstName.charAt(0)}${p.student.user.lastName.charAt(0)}`.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>{name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0f172a" }}>
                        {(p.amount / 1000).toFixed(0)}K <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "400" }}>UZS</span>
                      </div>
                      <span style={{
                        display: "inline-block", fontSize: "0.65rem", fontWeight: "700",
                        padding: "0.125rem 0.5rem", borderRadius: "9999px",
                        background: statusStyle.bg, color: statusStyle.color, marginTop: "0.125rem",
                        textTransform: "uppercase", letterSpacing: "0.03em",
                      }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ background: "white", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("dashboard.quickActions")}</h2>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.125rem 0 0" }}>Common tasks</p>
          </div>
          <div style={{ padding: "0.75rem" }}>
            {[
              { href: "/admin/students/new", icon: "👤", label: t("students.newStudent"), color: "#6366f1", bg: "#ede9fe" },
              { href: "/admin/teachers/new", icon: "👨‍🏫", label: t("teachers.newTeacher"), color: "#10b981", bg: "#d1fae5" },
              { href: "/admin/groups/new", icon: "📚", label: t("groups.newGroup"), color: "#f59e0b", bg: "#fef3c7" },
              { href: "/admin/payments/new", icon: "💳", label: t("payments.recordPayment"), color: "#3b82f6", bg: "#dbeafe" },
              { href: "/admin/announcements/new", icon: "📢", label: t("announcements.newAnnouncement"), color: "#8b5cf6", bg: "#ede9fe" },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="admin-quick-action" style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.75rem", borderRadius: "0.625rem", textDecoration: "none",
              }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "0.625rem",
                  background: a.bg, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "1rem", flexShrink: 0,
                }}>
                  {a.icon}
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>{a.label}</span>
                <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

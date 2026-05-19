import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

async function getStats() {
  const [students, teachers, groups, payments] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.group.count({ where: { isActive: true } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
  ]);

  const recentPayments = await prisma.payment.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { student: { include: { user: true } } },
  });

  const pendingPayments = await prisma.payment.count({ where: { status: "PENDING" } });
  const activeStudents = await prisma.student.count({ where: { user: { isActive: true } } });

  return { students, teachers, groups, totalRevenue: payments._sum.amount || 0, recentPayments, pendingPayments, activeStudents };
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const AVATAR_COLORS = ["#6366f1","#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const t = await getTranslations();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const statCards = [
    {
      label: t("dashboard.totalStudents"),
      value: stats.students,
      sub: `${stats.activeStudents} active`,
      color: "var(--primary, #6366f1)",
      bg: "#ede9fe",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: t("dashboard.totalTeachers"),
      value: stats.teachers,
      sub: "on staff",
      color: "#10b981",
      bg: "#d1fae5",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      ),
    },
    {
      label: t("dashboard.activeGroups"),
      value: stats.groups,
      sub: "currently running",
      color: "#f59e0b",
      bg: "#fef3c7",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
    },
    {
      label: t("dashboard.totalRevenue"),
      value: `${(stats.totalRevenue / 1_000_000).toFixed(1)}M`,
      sub: "UZS collected",
      color: "#3b82f6",
      bg: "#dbeafe",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
  ];

  const quickActions = [
    { href: "/admin/students/new", label: t("students.newStudent"), desc: "Enroll a new student" },
    { href: "/admin/teachers/new", label: t("teachers.newTeacher"), desc: "Add a teacher" },
    { href: "/admin/groups/new", label: t("groups.newGroup"), desc: "Create a class group" },
    { href: "/admin/announcements/new", label: t("announcements.newAnnouncement"), desc: "Notify all students" },
    { href: "/admin/payments/new", label: t("payments.recordPayment"), desc: "Log a payment" },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px" }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>
            {t("dashboard.adminTitle")}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>{t("dashboard.adminSubtitle")}</p>
        </div>
        <div style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "right", paddingTop: "0.25rem" }}>
          {today}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
        {statCards.map((card) => (
          <div key={card.label} style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "0.875rem",
            padding: "1.25rem 1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {card.label}
              </div>
              <div style={{ color: card.color, opacity: 0.8 }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", lineHeight: 1, marginBottom: "0.25rem" }}>
              {card.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem" }}>

        {/* Recent payments */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#0f172a", margin: "0 0 0.125rem" }}>{t("dashboard.recentPayments")}</h2>
              {stats.pendingPayments > 0 && (
                <p style={{ fontSize: "0.75rem", color: "#f59e0b", margin: 0 }}>
                  {stats.pendingPayments} payment{stats.pendingPayments > 1 ? "s" : ""} pending review
                </p>
              )}
            </div>
            <Link href="/admin/payments" style={{ fontSize: "0.8rem", color: "var(--primary, #6366f1)", fontWeight: "500", textDecoration: "none" }}>
              View all →
            </Link>
          </div>

          {stats.recentPayments.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💳</div>
              <div style={{ fontSize: "0.875rem" }}>{t("dashboard.noPayments")}</div>
            </div>
          ) : (
            <div style={{ padding: "0 0.5rem" }}>
              {stats.recentPayments.map((p, i) => {
                const name = `${p.student.user.firstName} ${p.student.user.lastName}`;
                const color = avatarColor(name);
                return (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0.875rem 1rem",
                    borderBottom: i < stats.recentPayments.length - 1 ? "1px solid #f8fafc" : "none",
                  }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: color, display: "flex", alignItems: "center",
                      justifyContent: "center", color: "white", fontSize: "0.75rem",
                      fontWeight: "700", flexShrink: 0,
                    }}>
                      {initials(p.student.user.firstName, p.student.user.lastName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>
                        {p.amount.toLocaleString()} <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "400" }}>UZS</span>
                      </div>
                      <span style={{
                        display: "inline-block", fontSize: "0.68rem", fontWeight: "600", padding: "0.15rem 0.5rem",
                        borderRadius: "9999px", marginTop: "0.125rem",
                        ...(p.status === "PAID"
                          ? { background: "#dcfce7", color: "#16a34a" }
                          : p.status === "PENDING"
                          ? { background: "#fef9c3", color: "#ca8a04" }
                          : { background: "#fee2e2", color: "#dc2626" }),
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
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>{t("dashboard.quickActions")}</h2>
          </div>
          <div style={{ padding: "0.5rem" }}>
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.75rem 1rem", borderRadius: "0.625rem", textDecoration: "none",
                gap: "0.75rem", transition: "background 0.15s",
              }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>{a.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{a.desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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

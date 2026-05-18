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
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { student: { include: { user: true } } },
  });

  const pendingPayments = await prisma.payment.count({
    where: { status: "PENDING" },
  });

  return { students, teachers, groups, totalRevenue: payments._sum.amount || 0, recentPayments, pendingPayments };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const t = await getTranslations();

  const statCards = [
    { label: t("dashboard.totalStudents"), value: stats.students, icon: "👨‍🎓", color: "var(--primary, #6366f1)", bg: "#ede9fe" },
    { label: t("dashboard.totalTeachers"), value: stats.teachers, icon: "👨‍🏫", color: "#10b981", bg: "#d1fae5" },
    { label: t("dashboard.activeGroups"), value: stats.groups, icon: "📚", color: "#f59e0b", bg: "#fef3c7" },
    { label: t("dashboard.totalRevenue"), value: `${stats.totalRevenue.toLocaleString()} UZS`, icon: "💰", color: "#3b82f6", bg: "#dbeafe" },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>
          {t("dashboard.adminTitle")}
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("dashboard.adminSubtitle")}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {statCards.map((card) => (
          <div key={card.label} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "12px",
              background: card.bg, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "1.5rem", flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "700", color: card.color }}>{card.value}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links + recent payments */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Quick actions */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", marginBottom: "1rem" }}>{t("dashboard.quickActions")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { href: "/admin/students/new", label: t("students.newStudent"), icon: "➕👨‍🎓" },
              { href: "/admin/teachers/new", label: t("teachers.newTeacher"), icon: "➕👨‍🏫" },
              { href: "/admin/groups/new", label: t("groups.newGroup"), icon: "➕📚" },
              { href: "/admin/announcements/new", label: t("announcements.newAnnouncement"), icon: "📢" },
            ].map((action) => (
              <Link key={action.href} href={action.href} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0",
                textDecoration: "none", color: "#1e293b", gap: "0.5rem",
                fontSize: "0.8rem", fontWeight: "500", transition: "all 0.2s",
              }}>
                <span style={{ fontSize: "1.5rem" }}>{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>{t("dashboard.recentPayments")}</h2>
            {stats.pendingPayments > 0 && (
              <span className="badge badge-yellow">{stats.pendingPayments} {t("payments.pending").toLowerCase()}</span>
            )}
          </div>
          {stats.recentPayments.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>{t("dashboard.noPayments")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {stats.recentPayments.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                      {p.student.user.firstName} {p.student.user.lastName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: "600" }}>{p.amount.toLocaleString()} UZS</div>
                    <span className={`badge ${p.status === "PAID" ? "badge-green" : p.status === "PENDING" ? "badge-yellow" : "badge-red"}`}>
                      {t(`payments.${p.status}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

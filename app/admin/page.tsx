import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

  const statCards = [
    { label: "Total Students", value: stats.students, icon: "👨‍🎓", color: "#6366f1", bg: "#ede9fe" },
    { label: "Teachers", value: stats.teachers, icon: "👨‍🏫", color: "#10b981", bg: "#d1fae5" },
    { label: "Active Groups", value: stats.groups, icon: "📚", color: "#f59e0b", bg: "#fef3c7" },
    { label: "Total Revenue", value: `${stats.totalRevenue.toLocaleString()} UZS`, icon: "💰", color: "#3b82f6", bg: "#dbeafe" },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>
          Dashboard
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>Welcome back! Here&apos;s what&apos;s happening at ETA Academy.</p>
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
          <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", marginBottom: "1rem" }}>Quick Actions</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { href: "/admin/students", label: "Add Student", icon: "➕👨‍🎓" },
              { href: "/admin/teachers", label: "Add Teacher", icon: "➕👨‍🏫" },
              { href: "/admin/groups", label: "New Group", icon: "➕📚" },
              { href: "/admin/announcements", label: "Announce", icon: "📢" },
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
            <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>Recent Payments</h2>
            {stats.pendingPayments > 0 && (
              <span className="badge badge-yellow">{stats.pendingPayments} pending</span>
            )}
          </div>
          {stats.recentPayments.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>No payments yet.</p>
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
                      {p.status}
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

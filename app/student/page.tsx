import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function StudentDashboard() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const student = user?.student;

  const groups = student
    ? await prisma.groupStudent.findMany({
        where: { studentId: student.id, isActive: true },
        include: {
          group: { include: { teacher: { include: { user: true } } } },
        },
      })
    : [];

  const recentGrades = student
    ? await prisma.grade.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  const pendingPayments = student
    ? await prisma.payment.count({
        where: { studentId: student.id, status: "PENDING" },
      })
    : 0;

  const avgScore =
    recentGrades.length > 0
      ? Math.round(recentGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / recentGrades.length)
      : null;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>
          {t("dashboard.studentTitle", { name: user?.firstName })} 🎓
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("dashboard.studentSubtitle")}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: t("dashboard.myClasses"), value: groups.length, icon: "📚", color: "#6366f1", bg: "#ede9fe" },
          { label: t("dashboard.avgScore"), value: avgScore !== null ? `${avgScore}%` : "—", icon: "📝", color: "#10b981", bg: "#d1fae5" },
          { label: t("dashboard.pendingPayments"), value: pendingPayments, icon: "💳", color: pendingPayments > 0 ? "#ef4444" : "#64748b", bg: pendingPayments > 0 ? "#fee2e2" : "#f1f5f9" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "700", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* My classes */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>{t("dashboard.myClasses")}</h2>
        {groups.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>{t("groups.noGroupsAssigned")}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {groups.map((gs) => (
              <div key={gs.id} style={{ border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem" }}>
                <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{gs.group.name}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
                  👨‍🏫 {gs.group.teacher.user.firstName} {gs.group.teacher.user.lastName}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem" }}>
                  🕐 {gs.group.schedule}
                </div>
                <span className="badge badge-blue">{t(`levels.${gs.group.level}`)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent grades */}
      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>{t("dashboard.recentGrades")}</h2>
        {recentGrades.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>{t("grades.noGrades")}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t("grades.assignment")}</th>
                <th>{t("grades.score")}</th>
                <th>{t("common.date")}</th>
              </tr>
            </thead>
            <tbody>
              {recentGrades.map((g) => (
                <tr key={g.id}>
                  <td>{g.label || t("grades.assignment")}</td>
                  <td>
                    <span className={`badge ${(g.score / g.maxScore) >= 0.8 ? "badge-green" : (g.score / g.maxScore) >= 0.6 ? "badge-yellow" : "badge-red"}`}>
                      {g.score}/{g.maxScore}
                    </span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.8rem" }}>
                    {new Date(g.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

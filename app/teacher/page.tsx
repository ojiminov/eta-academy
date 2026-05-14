import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function TeacherDashboard() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const teacher = user?.teacher;

  const groups = teacher
    ? await prisma.group.findMany({
        where: { teacherId: teacher.id, isActive: true },
        include: {
          groupStudents: { where: { isActive: true } },
          classSessions: { where: { isCompleted: false }, orderBy: { scheduledAt: "asc" }, take: 3 },
        },
      })
    : [];

  const totalStudents = groups.reduce((sum: number, g) => sum + g.groupStudents.length, 0);

  const upcomingSessions = groups.flatMap((g) =>
    g.classSessions.map((s) => ({ ...s, groupName: g.name }))
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).slice(0, 5);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>
          {t("dashboard.teacherTitle", { name: user?.firstName ?? "" })} 👋
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("dashboard.teacherSubtitle")}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: t("dashboard.activeGroups"), value: groups.length, icon: "📚", color: "#6366f1", bg: "#ede9fe" },
          { label: t("dashboard.totalStudents"), value: totalStudents, icon: "👨‍🎓", color: "#10b981", bg: "#d1fae5" },
          { label: t("dashboard.upcomingSessions"), value: upcomingSessions.length, icon: "📅", color: "#f59e0b", bg: "#fef3c7" },
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

      {/* Groups & upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>{t("nav.myGroups")}</h2>
          {groups.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>{t("groups.noGroupsAssigned")}</p>
          ) : (
            groups.map((g) => (
              <div key={g.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: "500", fontSize: "0.875rem" }}>{g.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{g.schedule}</div>
                </div>
                <span className="badge badge-blue">{t("common.students_count", { count: g.groupStudents.length })}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>{t("dashboard.upcomingSessions")}</h2>
          {upcomingSessions.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>{t("sessions.noSessions")}</p>
          ) : (
            upcomingSessions.map((s) => (
              <div key={s.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: "500", fontSize: "0.875rem" }}>{s.groupName}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {new Date(s.scheduledAt).toLocaleDateString()} · {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                {s.topic && <div style={{ fontSize: "0.75rem", color: "#6366f1" }}>{s.topic}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

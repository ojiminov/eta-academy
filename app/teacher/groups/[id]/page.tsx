import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function TeacherGroupDetailPage({ params }: { params: { id: string } }) {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const teacher = user?.teacher;

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      teacher: true,
      groupStudents: {
        where: { isActive: true },
        include: { student: { include: { user: true } } },
        orderBy: { joinedAt: "asc" },
      },
      classSessions: {
        orderBy: { scheduledAt: "desc" },
        take: 10,
        include: {
          attendances: true,
          grades: true,
        },
      },
    },
  });

  if (!group || group.teacherId !== teacher?.id) notFound();

  const totalSessions = group.classSessions.length;
  const completedSessions = group.classSessions.filter((s) => s.isCompleted).length;

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <Link href="/teacher/groups" style={{ color: "#10b981", textDecoration: "none", fontSize: "0.875rem" }}>
            ← {t("nav.myGroups")}
          </Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0.25rem 0 0.25rem" }}>{group.name}</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{t(`levels.${group.level}`)} · {group.schedule}</p>
        </div>
        <span className={`badge ${group.isActive ? "badge-green" : "badge-gray"}`} style={{ fontSize: "0.875rem", padding: "0.4rem 0.8rem" }}>
          {group.isActive ? t("common.active") : t("common.inactive")}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("nav.students"), value: group.groupStudents.length, icon: "👥", color: "var(--primary, #6366f1)" },
          { label: t("sessions.sessionsDone"), value: completedSessions, icon: "✅", color: "#10b981" },
          { label: t("sessions.sessionsTotal"), value: totalSessions, icon: "📅", color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "1.5rem" }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "700", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Students */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>
              {t("nav.students")} ({group.groupStudents.length})
            </h2>
          </div>
          {group.groupStudents.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
              {t("students.noStudentsEnrolled")}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t("common.name")}</th>
                  <th>{t("groups.level")}</th>
                  <th>{t("students.joined")}</th>
                </tr>
              </thead>
              <tbody>
                {group.groupStudents.map((gs) => (
                  <tr key={gs.id}>
                    <td style={{ fontWeight: "500" }}>
                      {gs.student.user.firstName} {gs.student.user.lastName}
                    </td>
                    <td>
                      <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>
                        {t(`levels.${gs.student.englishLevel}`)}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.8rem" }}>
                      {new Date(gs.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "1.25rem 1.5rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>{t("sessions.recentSessions")}</h2>
            <Link href="/teacher/sessions" style={{ fontSize: "0.8rem", color: "#10b981", textDecoration: "none" }}>
              {t("common.viewAll")} →
            </Link>
          </div>
          {group.classSessions.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
              {t("sessions.noSessions")}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t("common.date")}</th>
                  <th>{t("sessions.topic")}</th>
                  <th>{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {group.classSessions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(s.scheduledAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>{s.topic || "—"}</td>
                    <td>
                      <span className={`badge ${s.isCompleted ? "badge-green" : "badge-yellow"}`} style={{ fontSize: "0.7rem" }}>
                        {s.isCompleted ? t("sessions.complete") : t("sessions.upcomingBadge")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <Link href="/teacher/attendance" className="btn btn-secondary">
          ✅ {t("forms.markAttendance")}
        </Link>
        <Link href="/teacher/grades" className="btn btn-secondary">
          📝 {t("forms.enterGrades")}
        </Link>
        <Link href="/teacher/sessions" className="btn btn-primary">
          📅 {t("sessions.title")}
        </Link>
      </div>
    </div>
  );
}

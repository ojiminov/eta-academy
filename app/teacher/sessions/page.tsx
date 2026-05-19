import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function TeacherSessionsPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const teacher = user?.teacher;

  const sessions = teacher
    ? await prisma.classSession.findMany({
        where: { teacherId: teacher.id },
        include: { group: true, attendances: true, grades: true },
        orderBy: { scheduledAt: "desc" },
      })
    : [];

  const upcoming = sessions.filter((s) => !s.isCompleted).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const completed = sessions.filter((s) => s.isCompleted);

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{t("sessions.title")}</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
          {upcoming.length} {t("sessions.upcoming").toLowerCase()} · {completed.length} {t("sessions.completed").toLowerCase()}
        </p>
      </div>

      {sessions.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>📅</div>
          <div style={{ fontWeight: "600", color: "#0f172a" }}>{t("sessions.noSessions")}</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>{t("sessions.noSessionsDesc")}</div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: "1.25rem" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <span style={{ padding: "0.2rem 0.625rem", borderRadius: "9999px", background: "#fef9c3", color: "#ca8a04", fontSize: "0.72rem", fontWeight: "600" }}>
                  UPCOMING
                </span>
                <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("sessions.upcoming")} ({upcoming.length})</h2>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[t("sessions.scheduledAt"), t("sessions.group"), t("sessions.topic"), t("sessions.duration")].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < upcoming.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#0f172a" }}>
                          {new Date(s.scheduledAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontWeight: "500", color: "#0f172a", fontSize: "0.875rem" }}>{s.group.name}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#64748b", fontSize: "0.875rem" }}>{s.topic || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#64748b" }}>{t("sessions.minutes", { n: s.duration })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {completed.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <span style={{ padding: "0.2rem 0.625rem", borderRadius: "9999px", background: "#dcfce7", color: "#16a34a", fontSize: "0.72rem", fontWeight: "600" }}>
                  COMPLETED
                </span>
                <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("sessions.completed")} ({completed.length})</h2>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[t("sessions.scheduledAt"), t("sessions.group"), t("sessions.topic"), t("nav.attendance"), t("nav.grades")].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {completed.map((s, i) => {
                    const present = s.attendances.filter((a) => a.status === "PRESENT").length;
                    return (
                      <tr key={s.id} style={{ borderBottom: i < completed.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#0f172a" }}>
                            {new Date(s.scheduledAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>
                        <td style={{ padding: "0.875rem 1rem", fontWeight: "500", color: "#0f172a", fontSize: "0.875rem" }}>{s.group.name}</td>
                        <td style={{ padding: "0.875rem 1rem", color: "#64748b", fontSize: "0.875rem" }}>{s.topic || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          {s.attendances.length > 0 ? (
                            <span style={{ fontSize: "0.8rem", color: "#0f172a" }}>
                              {t("sessions.attendanceCount", { present, total: s.attendances.length })}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{t("sessions.noAttendance")}</span>
                          )}
                        </td>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          {s.grades.length > 0 ? (
                            <span style={{ fontSize: "0.8rem", color: "#0f172a" }}>{t("sessions.gradesCount", { n: s.grades.length })}</span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{t("sessions.noGrades")}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

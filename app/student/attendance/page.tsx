import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function StudentAttendancePage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const student = user?.student;

  const attendances = student
    ? await prisma.attendance.findMany({
        where: { studentId: student.id },
        include: {
          classSession: { include: { group: true } },
        },
        orderBy: { classSession: { scheduledAt: "desc" } },
      })
    : [];

  const total = attendances.length;
  const present = attendances.filter((a) => a.status === "PRESENT").length;
  const absent = attendances.filter((a) => a.status === "ABSENT").length;
  const late = attendances.filter((a) => a.status === "LATE").length;
  const excused = attendances.filter((a) => a.status === "EXCUSED").length;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : null;

  const statusColor: Record<string, string> = {
    PRESENT: "badge-green",
    ABSENT: "badge-red",
    LATE: "badge-yellow",
    EXCUSED: "badge-gray",
  };

  const statusIcon: Record<string, string> = {
    PRESENT: "✅",
    ABSENT: "❌",
    LATE: "⏰",
    EXCUSED: "📋",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{t("attendance.title")}</h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("attendance.studentSubtitle")}</p>
      </div>

      {total === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h3 style={{ color: "#1e293b" }}>{t("attendance.noAttendance")}</h3>
          <p style={{ color: "#64748b" }}>{t("attendance.noAttendanceDesc")}</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: t("attendance.present"), value: present, color: "#10b981", bg: "#d1fae5", icon: "✅" },
              { label: t("attendance.absent"), value: absent, color: "#ef4444", bg: "#fee2e2", icon: "❌" },
              { label: t("attendance.late"), value: late, color: "#f59e0b", bg: "#fef3c7", icon: "⏰" },
              { label: t("attendance.excused"), value: excused, color: "#64748b", bg: "#f1f5f9", icon: "📋" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "700", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Rate bar */}
          {attendanceRate !== null && (
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: "600", color: "#1e293b" }}>{t("attendance.rate")}</span>
                <span style={{
                  fontSize: "1.5rem", fontWeight: "700",
                  color: attendanceRate >= 80 ? "#10b981" : attendanceRate >= 60 ? "#f59e0b" : "#ef4444",
                }}>
                  {attendanceRate}%
                </span>
              </div>
              <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${attendanceRate}%`,
                  background: attendanceRate >= 80 ? "#10b981" : attendanceRate >= 60 ? "#f59e0b" : "#ef4444",
                  borderRadius: "5px",
                  transition: "width 0.5s",
                }} />
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                {t("attendance.outOf", { present, total })}
              </div>
            </div>
          )}

          {/* Attendance log */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>{t("attendance.sessionHistory")}</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>{t("common.date")}</th>
                  <th>{t("payments.class")}</th>
                  <th>{t("sessions.topic")}</th>
                  <th>{t("common.status")}</th>
                  <th>{t("common.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((att) => (
                  <tr key={att.id}>
                    <td style={{ fontSize: "0.875rem" }}>
                      <div style={{ fontWeight: "500" }}>
                        {new Date(att.classSession.scheduledAt).toLocaleDateString(undefined, {
                          weekday: "short", day: "numeric", month: "short"
                        })}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {new Date(att.classSession.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td style={{ fontWeight: "500", fontSize: "0.875rem" }}>{att.classSession.group.name}</td>
                    <td style={{ color: "#64748b", fontSize: "0.875rem" }}>{att.classSession.topic || "—"}</td>
                    <td>
                      <span className={`badge ${statusColor[att.status] || "badge-gray"}`} style={{ fontSize: "0.75rem" }}>
                        {statusIcon[att.status]} {t(`attendance.${att.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.8rem" }}>{att.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

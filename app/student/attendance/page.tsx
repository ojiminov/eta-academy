import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  PRESENT:  { bg: "#dcfce7", color: "#16a34a", dot: "#16a34a" },
  ABSENT:   { bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
  LATE:     { bg: "#fef9c3", color: "#ca8a04", dot: "#ca8a04" },
  EXCUSED:  { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
};

export default async function StudentAttendancePage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const student = user?.student;

  const attendances = student
    ? await prisma.attendance.findMany({
        where: { studentId: student.id },
        include: { classSession: { include: { group: true } } },
        orderBy: { classSession: { scheduledAt: "desc" } },
      })
    : [];

  const total = attendances.length;
  const present = attendances.filter(a => a.status === "PRESENT").length;
  const absent = attendances.filter(a => a.status === "ABSENT").length;
  const late = attendances.filter(a => a.status === "LATE").length;
  const excused = attendances.filter(a => a.status === "EXCUSED").length;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : null;
  const rateColor = attendanceRate === null ? "#94a3b8" : attendanceRate >= 80 ? "#10b981" : attendanceRate >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{t("attendance.title")}</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>{t("attendance.studentSubtitle")}</p>
      </div>

      {total === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>✅</div>
          <div style={{ fontWeight: "600", color: "#0f172a" }}>{t("attendance.noAttendance")}</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>{t("attendance.noAttendanceDesc")}</div>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: t("attendance.present"), value: present, color: "#10b981", borderColor: "#10b981" },
              { label: t("attendance.absent"),  value: absent,  color: "#ef4444", borderColor: "#ef4444" },
              { label: t("attendance.late"),    value: late,    color: "#f59e0b", borderColor: "#f59e0b" },
              { label: t("attendance.excused"), value: excused, color: "#64748b", borderColor: "#94a3b8" },
            ].map(s => (
              <div key={s.label} style={{
                background: "white", border: "1px solid #e2e8f0",
                borderTop: `3px solid ${s.borderColor}`,
                borderRadius: "0.875rem", padding: "1.125rem 1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginTop: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rate bar */}
          {attendanceRate !== null && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "0.9375rem" }}>{t("attendance.rate")}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.125rem" }}>{t("attendance.outOf", { present, total })}</div>
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: rateColor, lineHeight: 1 }}>{attendanceRate}%</div>
              </div>
              <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${attendanceRate}%`, background: rateColor, borderRadius: "9999px" }} />
              </div>
            </div>
          )}

          {/* Attendance log */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc" }}>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("attendance.sessionHistory")}</h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {[t("common.date"), t("payments.class"), t("sessions.topic"), t("common.status"), t("common.notes")].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendances.map((att, i) => {
                  const st = STATUS_STYLE[att.status] || STATUS_STYLE.EXCUSED;
                  return (
                    <tr key={att.id} style={{ borderBottom: i < attendances.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#0f172a" }}>
                          {new Date(att.classSession.scheduledAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                          {new Date(att.classSession.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontWeight: "500", fontSize: "0.875rem", color: "#0f172a" }}>{att.classSession.group.name}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#64748b", fontSize: "0.875rem" }}>{att.classSession.topic || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.625rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600", background: st.bg, color: st.color }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: st.dot }} />
                          {t(`attendance.${att.status.toLowerCase()}`)}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", color: "#64748b", fontSize: "0.8rem" }}>{att.notes || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

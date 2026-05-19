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

export default async function TeacherAttendancePage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const teacher = user?.teacher;

  const sessions = teacher
    ? await prisma.classSession.findMany({
        where: { teacherId: teacher.id, isCompleted: true },
        include: {
          group: true,
          attendances: { include: { classSession: true } },
        },
        orderBy: { scheduledAt: "desc" },
        take: 20,
      })
    : [];

  const groups = teacher
    ? await prisma.group.findMany({
        where: { teacherId: teacher.id, isActive: true },
        include: {
          groupStudents: { where: { isActive: true }, include: { student: { include: { user: true } } } },
          classSessions: { where: { isCompleted: true }, include: { attendances: true } },
        },
      })
    : [];

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{t("attendance.title")}</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>{t("attendance.subtitle")}</p>
      </div>

      {groups.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>✅</div>
          <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "0.375rem" }}>{t("attendance.noGroups")}</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>{t("attendance.noGroupsDesc")}</div>
        </div>
      ) : (
        <>
          {/* Group summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
            {groups.map((g) => {
              const totalAttendances = g.classSessions.flatMap((s) => s.attendances).length;
              const presentCount = g.classSessions.flatMap((s) => s.attendances).filter((a) => a.status === "PRESENT").length;
              const rate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : null;
              const rateColor = rate === null ? "#94a3b8" : rate >= 80 ? "#10b981" : rate >= 60 ? "#f59e0b" : "#ef4444";

              return (
                <div key={g.id} style={{
                  background: "white", border: "1px solid #e2e8f0",
                  borderTop: `3px solid ${rateColor}`,
                  borderRadius: "0.875rem", padding: "1.25rem 1.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
                    <div>
                      <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "0.9375rem" }}>{g.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.125rem" }}>{g.groupStudents.length} students · {g.classSessions.length} sessions</div>
                    </div>
                    {rate !== null && (
                      <div style={{ fontWeight: "800", fontSize: "1.5rem", color: rateColor, lineHeight: 1 }}>
                        {rate}%
                      </div>
                    )}
                  </div>
                  <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${rate ?? 0}%`, background: rateColor, borderRadius: "9999px" }} />
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                    {presentCount} present / {totalAttendances} total records
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent session attendance */}
          {sessions.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc" }}>
                <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("attendance.recentRecords")}</h2>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.125rem 0 0" }}>Completed session records</p>
              </div>
              {sessions.map((session, i) => {
                const present = session.attendances.filter((a) => a.status === "PRESENT").length;
                const total = session.attendances.length;
                return (
                  <div key={session.id} style={{ padding: "1rem 1.5rem", borderBottom: i < sessions.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#0f172a" }}>
                          {session.group.name}{session.topic ? ` — ${session.topic}` : ""}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {new Date(session.scheduledAt).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                        </div>
                      </div>
                      <span style={{
                        padding: "0.2rem 0.75rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: "600",
                        background: total > 0 && present / total >= 0.8 ? "#dcfce7" : "#fef9c3",
                        color: total > 0 && present / total >= 0.8 ? "#16a34a" : "#ca8a04",
                      }}>
                        {present}/{total} present
                      </span>
                    </div>
                    {session.attendances.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                        {session.attendances.map((att) => {
                          const st = STATUS_STYLE[att.status] || STATUS_STYLE.EXCUSED;
                          return (
                            <span key={att.id} style={{
                              display: "inline-flex", alignItems: "center", gap: "0.25rem",
                              padding: "0.15rem 0.5rem", borderRadius: "9999px",
                              fontSize: "0.65rem", fontWeight: "600",
                              background: st.bg, color: st.color,
                            }}>
                              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: st.dot }} />
                              {t(`attendance.${att.status.toLowerCase()}`)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {session.attendances.length === 0 && (
                      <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: 0 }}>{t("attendance.noSessionRecords")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

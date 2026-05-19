import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  BEGINNER:          { bg: "#f1f5f9", color: "#475569" },
  ELEMENTARY:        { bg: "#dbeafe", color: "#1e40af" },
  PRE_INTERMEDIATE:  { bg: "#dbeafe", color: "#1e40af" },
  INTERMEDIATE:      { bg: "#fef9c3", color: "#854d0e" },
  UPPER_INTERMEDIATE:{ bg: "#fef3c7", color: "#b45309" },
  ADVANCED:          { bg: "#dcfce7", color: "#166534" },
};

export default async function StudentGroupsPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const student = user?.student;

  const groupStudents = student
    ? await prisma.groupStudent.findMany({
        where: { studentId: student.id, isActive: true },
        include: {
          group: {
            include: {
              teacher: { include: { user: true } },
              groupStudents: { where: { isActive: true } },
              classSessions: { where: { isCompleted: false }, orderBy: { scheduledAt: "asc" }, take: 3 },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      })
    : [];

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{t("nav.myClasses")}</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
          {t("students.enrolledCount", { count: groupStudents.length })}
        </p>
      </div>

      {groupStudents.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>📚</div>
          <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "0.25rem" }}>{t("groups.noGroups")}</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>{t("groups.adminWillAssign")}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {groupStudents.map(({ group, joinedAt }) => {
            const levelStyle = LEVEL_STYLE[group.level] || { bg: "#dbeafe", color: "#1e40af" };
            return (
              <div key={group.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.5rem" }}>{group.name}</h2>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span style={{ display: "inline-flex", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600", background: levelStyle.bg, color: levelStyle.color }}>
                        {t(`levels.${group.level}`)}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600", background: "#dcfce7", color: "#16a34a" }}>
                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#16a34a" }} />
                        {t("common.active")}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    Joined {new Date(joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>

                <div style={{ padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {[
                      { icon: "👨‍🏫", text: `${group.teacher.user.firstName} ${group.teacher.user.lastName}` },
                      { icon: "🕐", text: group.schedule },
                      { icon: "👥", text: `${group.groupStudents.length} / ${group.maxStudents} students` },
                      { icon: "💰", text: `${group.monthlyFee.toLocaleString()} UZS/mo` },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#475569" }}>
                        <span style={{ fontSize: "0.875rem", width: "18px", textAlign: "center" }}>{row.icon}</span>
                        <span>{row.text}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>
                      {t("dashboard.upcomingSessions")}
                    </div>
                    {group.classSessions.length === 0 ? (
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{t("sessions.noSessions")}</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {group.classSessions.map(s => (
                          <div key={s.id} style={{ fontSize: "0.78rem", color: "#0f172a", background: "#f8fafc", borderRadius: "0.5rem", padding: "0.4rem 0.75rem" }}>
                            <span style={{ fontWeight: "600" }}>
                              {new Date(s.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            {" · "}
                            <span style={{ color: "#64748b" }}>{new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {s.topic && <span style={{ color: "var(--primary, #6366f1)" }}> · {s.topic}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {group.teacher.user.phone && (
                  <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid #f8fafc", fontSize: "0.78rem", color: "#64748b" }}>
                    📞 Teacher: {group.teacher.user.phone}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

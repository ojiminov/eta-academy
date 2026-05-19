import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function TeacherGradesPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const teacher = user?.teacher;

  const groups = teacher
    ? await prisma.group.findMany({
        where: { teacherId: teacher.id, isActive: true },
        include: {
          groupStudents: {
            where: { isActive: true },
            include: { student: { include: { user: true, grades: { orderBy: { createdAt: "desc" }, take: 5 } } } },
          },
        },
        orderBy: { name: "asc" },
      })
    : [];

  const recentGrades = teacher
    ? await prisma.grade.findMany({
        where: { student: { groupStudents: { some: { group: { teacherId: teacher.id }, isActive: true } } } },
        include: { student: { include: { user: true } }, classSession: { include: { group: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{t("grades.teacherTitle")}</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>{t("grades.teacherSubtitle")}</p>
      </div>

      {groups.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>📝</div>
          <div style={{ fontWeight: "600", color: "#0f172a" }}>{t("grades.noGroups")}</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>{t("grades.noGroupsDesc")}</div>
        </div>
      ) : (
        <>
          {groups.map((g) => {
            const allGrades = g.groupStudents.flatMap((gs) => gs.student.grades);
            const avgScore = allGrades.length > 0
              ? Math.round(allGrades.reduce((s, gr) => s + (gr.score / gr.maxScore) * 100, 0) / allGrades.length)
              : null;
            const avgColor = avgScore === null ? "#94a3b8" : avgScore >= 80 ? "#10b981" : avgScore >= 60 ? "#f59e0b" : "#ef4444";

            return (
              <div key={g.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: "1.25rem" }}>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.125rem" }}>{g.name}</h2>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{g.groupStudents.length} students</span>
                  </div>
                  {avgScore !== null && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.625rem", fontWeight: "800", color: avgColor, lineHeight: 1 }}>{avgScore}%</div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{t("grades.groupAvg")}</div>
                    </div>
                  )}
                </div>
                {g.groupStudents.length === 0 ? (
                  <div style={{ padding: "1.5rem", color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>
                    {t("students.noStudentsEnrolled")}
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {[t("grades.student"), `${t("grades.title")} (×5)`, t("common.average"), t("grades.trend")].map(h => (
                          <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {g.groupStudents.map((gs) => {
                        const grades = gs.student.grades;
                        const avg = grades.length > 0
                          ? Math.round(grades.reduce((s, gr) => s + (gr.score / gr.maxScore) * 100, 0) / grades.length)
                          : null;
                        const avgCol = avg === null ? "#94a3b8" : avg >= 80 ? "#10b981" : avg >= 60 ? "#f59e0b" : "#ef4444";

                        return (
                          <tr key={gs.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.875rem 1rem", fontWeight: "500", fontSize: "0.875rem", color: "#0f172a" }}>
                              {gs.student.user.firstName} {gs.student.user.lastName}
                            </td>
                            <td style={{ padding: "0.875rem 1rem" }}>
                              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                {grades.length === 0 ? (
                                  <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{t("grades.noGrades")}</span>
                                ) : (
                                  grades.map((gr) => {
                                    const pct = Math.round((gr.score / gr.maxScore) * 100);
                                    return (
                                      <span key={gr.id} style={{
                                        display: "inline-flex", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600",
                                        background: pct >= 80 ? "#dcfce7" : pct >= 60 ? "#fef9c3" : "#fee2e2",
                                        color: pct >= 80 ? "#16a34a" : pct >= 60 ? "#ca8a04" : "#dc2626",
                                      }} title={gr.label || t("grades.assignment")}>
                                        {pct}%
                                      </span>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "0.875rem 1rem" }}>
                              {avg !== null ? (
                                <span style={{ fontWeight: "700", fontSize: "0.9rem", color: avgCol }}>{avg}%</span>
                              ) : (
                                <span style={{ color: "#94a3b8" }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: "0.875rem 1rem", fontSize: "1.125rem" }}>
                              {grades.length >= 2 ? (() => {
                                const first = (grades[grades.length - 1].score / grades[grades.length - 1].maxScore) * 100;
                                const last = (grades[0].score / grades[0].maxScore) * 100;
                                return last > first ? "📈" : last < first ? "📉" : "➡️";
                              })() : <span style={{ color: "#94a3b8" }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}

          {/* Recent grade log */}
          {recentGrades.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc" }}>
                <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("grades.recentLog")}</h2>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[t("grades.student"), t("grades.label"), t("grades.score"), t("sessions.group"), t("common.date")].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentGrades.map((gr, i) => {
                    const pct = Math.round((gr.score / gr.maxScore) * 100);
                    return (
                      <tr key={gr.id} style={{ borderBottom: i < recentGrades.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <td style={{ padding: "0.875rem 1rem", fontWeight: "500", fontSize: "0.875rem", color: "#0f172a" }}>
                          {gr.student.user.firstName} {gr.student.user.lastName}
                        </td>
                        <td style={{ padding: "0.875rem 1rem", color: "#64748b", fontSize: "0.875rem" }}>{gr.label || t("grades.assignment")}</td>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <span style={{
                            display: "inline-flex", padding: "0.2rem 0.625rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: "600",
                            background: pct >= 80 ? "#dcfce7" : pct >= 60 ? "#fef9c3" : "#fee2e2",
                            color: pct >= 80 ? "#16a34a" : pct >= 60 ? "#ca8a04" : "#dc2626",
                          }}>
                            {gr.score}/{gr.maxScore} ({pct}%)
                          </span>
                        </td>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#64748b" }}>{gr.classSession?.group?.name || "—"}</td>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#64748b" }}>
                          {new Date(gr.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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

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
            include: {
              student: {
                include: {
                  user: true,
                  grades: { orderBy: { createdAt: "desc" }, take: 5 },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      })
    : [];

  const recentGrades = teacher
    ? await prisma.grade.findMany({
        where: {
          student: {
            groupStudents: {
              some: { group: { teacherId: teacher.id }, isActive: true },
            },
          },
        },
        include: {
          student: { include: { user: true } },
          classSession: { include: { group: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{t("grades.teacherTitle")}</h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("grades.teacherSubtitle")}</p>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📝</div>
          <h3 style={{ color: "#1e293b" }}>{t("grades.noGroups")}</h3>
          <p style={{ color: "#64748b" }}>{t("grades.noGroupsDesc")}</p>
        </div>
      ) : (
        <>
          {groups.map((g) => {
            const allGrades = g.groupStudents.flatMap((gs) => gs.student.grades);
            const avgScore = allGrades.length > 0
              ? Math.round(allGrades.reduce((s, gr) => s + (gr.score / gr.maxScore) * 100, 0) / allGrades.length)
              : null;

            return (
              <div key={g.id} className="card" style={{ marginBottom: "1.5rem", padding: 0 }}>
                <div style={{ padding: "1.25rem 1.5rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: "0 0 0.2rem" }}>{g.name}</h2>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{t("common.students_count", { count: g.groupStudents.length })}</span>
                  </div>
                  {avgScore !== null && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: "1.5rem", fontWeight: "700",
                        color: avgScore >= 80 ? "#10b981" : avgScore >= 60 ? "#f59e0b" : "#ef4444",
                      }}>
                        {avgScore}%
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{t("grades.groupAvg")}</div>
                    </div>
                  )}
                </div>
                {g.groupStudents.length === 0 ? (
                  <div style={{ padding: "1.5rem", color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>
                    {t("students.noStudentsEnrolled")}
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>{t("grades.student")}</th>
                        <th>{t("grades.title")} (×5)</th>
                        <th>{t("common.average")}</th>
                        <th>{t("grades.trend")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.groupStudents.map((gs) => {
                        const grades = gs.student.grades;
                        const avg = grades.length > 0
                          ? Math.round(grades.reduce((s, gr) => s + (gr.score / gr.maxScore) * 100, 0) / grades.length)
                          : null;

                        return (
                          <tr key={gs.id}>
                            <td style={{ fontWeight: "500" }}>
                              {gs.student.user.firstName} {gs.student.user.lastName}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                                {grades.length === 0 ? (
                                  <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{t("grades.noGrades")}</span>
                                ) : (
                                  grades.map((gr) => {
                                    const pct = Math.round((gr.score / gr.maxScore) * 100);
                                    return (
                                      <span
                                        key={gr.id}
                                        className={`badge ${pct >= 80 ? "badge-green" : pct >= 60 ? "badge-yellow" : "badge-red"}`}
                                        style={{ fontSize: "0.7rem" }}
                                        title={gr.label || t("grades.assignment")}
                                      >
                                        {pct}%
                                      </span>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                            <td>
                              {avg !== null ? (
                                <span style={{
                                  fontWeight: "700",
                                  color: avg >= 80 ? "#10b981" : avg >= 60 ? "#f59e0b" : "#ef4444",
                                }}>
                                  {avg}%
                                </span>
                              ) : (
                                <span style={{ color: "#94a3b8" }}>—</span>
                              )}
                            </td>
                            <td>
                              {grades.length >= 2 ? (
                                (() => {
                                  const first = (grades[grades.length - 1].score / grades[grades.length - 1].maxScore) * 100;
                                  const last = (grades[0].score / grades[0].maxScore) * 100;
                                  return last > first ? "📈" : last < first ? "📉" : "➡️";
                                })()
                              ) : "—"}
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

          {recentGrades.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  {t("grades.recentLog")}
                </h2>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{t("grades.student")}</th>
                    <th>{t("grades.label")}</th>
                    <th>{t("grades.score")}</th>
                    <th>{t("sessions.group")}</th>
                    <th>{t("common.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGrades.map((gr) => {
                    const pct = Math.round((gr.score / gr.maxScore) * 100);
                    return (
                      <tr key={gr.id}>
                        <td style={{ fontWeight: "500" }}>
                          {gr.student.user.firstName} {gr.student.user.lastName}
                        </td>
                        <td style={{ color: "#64748b", fontSize: "0.875rem" }}>{gr.label || t("grades.assignment")}</td>
                        <td>
                          <span className={`badge ${pct >= 80 ? "badge-green" : pct >= 60 ? "badge-yellow" : "badge-red"}`}>
                            {gr.score}/{gr.maxScore} ({pct}%)
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {gr.classSession?.group?.name || "—"}
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {new Date(gr.createdAt).toLocaleDateString()}
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

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function StudentGradesPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const student = user?.student;

  const grades = student
    ? await prisma.grade.findMany({
        where: { studentId: student.id },
        include: {
          classSession: { include: { group: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const totalGrades = grades.length;
  const avgScore = totalGrades > 0
    ? Math.round(grades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / totalGrades)
    : null;

  const excellent = grades.filter((g) => (g.score / g.maxScore) >= 0.9).length;
  const good = grades.filter((g) => (g.score / g.maxScore) >= 0.7 && (g.score / g.maxScore) < 0.9).length;
  const pass = grades.filter((g) => (g.score / g.maxScore) >= 0.5 && (g.score / g.maxScore) < 0.7).length;
  const fail = grades.filter((g) => (g.score / g.maxScore) < 0.5).length;

  const byGroup = grades.reduce<Record<string, typeof grades>>((acc, g) => {
    const groupName = g.classSession?.group?.name ?? t("grades.assignment");
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(g);
    return acc;
  }, {});

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{t("grades.title")}</h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("grades.subtitle")}</p>
      </div>

      {totalGrades === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📝</div>
          <h3 style={{ color: "#1e293b" }}>{t("grades.noGrades")}</h3>
          <p style={{ color: "#64748b" }}>{t("grades.noGradesDesc")}</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: t("grades.excellent"), value: excellent, color: "#10b981", bg: "#d1fae5" },
              { label: t("grades.good"), value: good, color: "var(--primary, #6366f1)", bg: "#ede9fe" },
              { label: t("grades.pass"), value: pass, color: "#f59e0b", bg: "#fef3c7" },
              { label: t("grades.needsWork"), value: fail, color: "#ef4444", bg: "#fee2e2" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: "700", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Overall average */}
          {avgScore !== null && (
            <div className="card" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: avgScore >= 80 ? "#d1fae5" : avgScore >= 60 ? "#fef3c7" : "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{
                  fontSize: "1.5rem", fontWeight: "700",
                  color: avgScore >= 80 ? "#10b981" : avgScore >= 60 ? "#f59e0b" : "#ef4444",
                }}>
                  {avgScore}%
                </span>
              </div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "1rem", color: "#1e293b" }}>{t("grades.overall")}</div>
                <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  {t("grades.basedOn", { n: totalGrades })}
                </div>
                <div style={{ color: avgScore >= 80 ? "#10b981" : avgScore >= 60 ? "#f59e0b" : "#ef4444", fontWeight: "500", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  {avgScore >= 90 ? "🌟" : avgScore >= 80 ? "👍" : avgScore >= 70 ? "📈" : "💪"}
                </div>
              </div>
            </div>
          )}

          {/* By group */}
          {Object.entries(byGroup).map(([groupName, groupGrades]) => {
            const groupAvg = Math.round(groupGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / groupGrades.length);
            return (
              <div key={groupName} className="card" style={{ marginBottom: "1.5rem", padding: 0 }}>
                <div style={{ padding: "1.25rem 1.5rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>{groupName}</h2>
                  <span style={{ fontWeight: "700", color: groupAvg >= 80 ? "#10b981" : groupAvg >= 60 ? "#f59e0b" : "#ef4444" }}>
                    {t("common.average")}: {groupAvg}%
                  </span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>{t("grades.assignment")}</th>
                      <th>{t("grades.score")}</th>
                      <th>{t("grades.percentage")}</th>
                      <th>{t("common.date")}</th>
                      <th>{t("common.notes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupGrades.map((g) => {
                      const pct = Math.round((g.score / g.maxScore) * 100);
                      return (
                        <tr key={g.id}>
                          <td style={{ fontWeight: "500" }}>{g.label || t("grades.assignment")}</td>
                          <td style={{ fontSize: "0.875rem" }}>{g.score} / {g.maxScore}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span className={`badge ${pct >= 80 ? "badge-green" : pct >= 60 ? "badge-yellow" : "badge-red"}`}>
                                {pct}%
                              </span>
                              <div style={{ flex: 1, height: "4px", background: "#f1f5f9", borderRadius: "2px", minWidth: "60px", overflow: "hidden" }}>
                                <div style={{
                                  height: "100%", width: `${pct}%`,
                                  background: pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444",
                                  borderRadius: "2px",
                                }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {new Date(g.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ fontSize: "0.8rem", color: "#64748b" }}>{g.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

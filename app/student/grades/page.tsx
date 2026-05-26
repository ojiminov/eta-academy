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
        include: { classSession: { include: { group: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const totalGrades = grades.length;
  const avgScore = totalGrades > 0
    ? Math.round(grades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / totalGrades)
    : null;

  const excellent = grades.filter(g => (g.score / g.maxScore) >= 0.9).length;
  const good      = grades.filter(g => (g.score / g.maxScore) >= 0.7 && (g.score / g.maxScore) < 0.9).length;
  const pass      = grades.filter(g => (g.score / g.maxScore) >= 0.5 && (g.score / g.maxScore) < 0.7).length;
  const fail      = grades.filter(g => (g.score / g.maxScore) < 0.5).length;

  const avgColor = avgScore === null ? "#94a3b8" : avgScore >= 80 ? "#10b981" : avgScore >= 60 ? "#f59e0b" : "#ef4444";

  const byGroup = grades.reduce<Record<string, typeof grades>>((acc, g) => {
    const groupName = g.classSession?.group?.name ?? t("grades.assignment");
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(g);
    return acc;
  }, {});

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{t("grades.title")}</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>{t("grades.subtitle")}</p>
      </div>

      {totalGrades === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>📝</div>
          <div style={{ fontWeight: "600", color: "#0f172a" }}>{t("grades.noGrades")}</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>{t("grades.noGradesDesc")}</div>
        </div>
      ) : (
        <>
          {/* Summary stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: t("grades.excellent"), value: excellent, color: "#10b981", borderColor: "#10b981" },
              { label: t("grades.good"),      value: good,      color: "var(--primary)", borderColor: "var(--primary)" },
              { label: t("grades.pass"),      value: pass,      color: "#f59e0b", borderColor: "#f59e0b" },
              { label: t("grades.needsWork"), value: fail,      color: "#ef4444", borderColor: "#ef4444" },
            ].map(s => (
              <div key={s.label} style={{
                background: "white", border: "1px solid #e2e8f0",
                borderTop: `3px solid ${s.borderColor}`,
                borderRadius: "0.875rem", padding: "1.125rem 1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center",
              }}>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#94a3b8", marginTop: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Overall average */}
          {avgScore !== null && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: avgScore >= 80 ? "#d1fae5" : avgScore >= 60 ? "#fef3c7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "1.375rem", fontWeight: "800", color: avgColor }}>{avgScore}%</span>
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "1rem", color: "#0f172a" }}>{t("grades.overall")}</div>
                <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>{t("grades.basedOn", { n: totalGrades })}</div>
                <div style={{ color: avgColor, fontWeight: "600", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  {avgScore >= 90 ? "🌟 Excellent" : avgScore >= 80 ? "👍 Great" : avgScore >= 70 ? "📈 Good" : "💪 Keep going"}
                </div>
              </div>
            </div>
          )}

          {/* By group */}
          {Object.entries(byGroup).map(([groupName, groupGrades]) => {
            const groupAvg = Math.round(groupGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / groupGrades.length);
            const groupAvgColor = groupAvg >= 80 ? "#10b981" : groupAvg >= 60 ? "#f59e0b" : "#ef4444";
            return (
              <div key={groupName} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: "1.25rem" }}>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{groupName}</h2>
                  <span style={{ fontWeight: "800", fontSize: "1rem", color: groupAvgColor }}>{t("common.average")}: {groupAvg}%</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {[t("grades.assignment"), t("grades.score"), t("grades.percentage"), t("common.date"), t("common.notes")].map(h => (
                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupGrades.map((g, i) => {
                      const pct = Math.round((g.score / g.maxScore) * 100);
                      const pctColor = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";
                      const pctBg = pct >= 80 ? "#dcfce7" : pct >= 60 ? "#fef9c3" : "#fee2e2";
                      return (
                        <tr key={g.id} style={{ borderBottom: i < groupGrades.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                          <td style={{ padding: "0.875rem 1rem", fontWeight: "500", fontSize: "0.875rem", color: "#0f172a" }}>{g.label || t("grades.assignment")}</td>
                          <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#475569" }}>{g.score} / {g.maxScore}</td>
                          <td style={{ padding: "0.875rem 1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                              <span style={{ display: "inline-flex", padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "700", background: pctBg, color: pctColor }}>
                                {pct}%
                              </span>
                              <div style={{ flex: 1, height: "4px", background: "#f1f5f9", borderRadius: "2px", minWidth: "60px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: pctColor, borderRadius: "2px" }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#64748b" }}>
                            {new Date(g.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#64748b" }}>{g.notes || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
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

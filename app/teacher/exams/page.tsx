"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type ExamResult = {
  id: string; score?: number; feedback?: string;
  student: { user: { firstName: string; lastName: string } };
};
type Exam = {
  id: string; title: string; scheduledAt: string; maxScore: number;
  group: { name: string };
  results: ExamResult[];
};

export default function TeacherExamsPage() {
  const t = useTranslations();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { score: string; feedback: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/teacher/exams").then(r => r.json()).then(setExams).finally(() => setLoading(false));
  }, []);

  async function saveResults(examId: string) {
    setSaving(true);
    const updates = Object.entries(scoreInputs)
      .filter(([, v]) => v.score !== "")
      .map(([resultId, v]) => ({ resultId, score: Number(v.score), feedback: v.feedback }));
    await fetch("/api/teacher/exams", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId, results: updates }) });
    const data = await fetch("/api/teacher/exams").then(r => r.json());
    setExams(data);
    setScoreInputs({});
    setSaving(false);
  }

  const totalExams = exams.length;
  const allResults = exams.flatMap(e => e.results.filter(r => r.score != null));
  const avgScore = allResults.length > 0 ? Math.round(allResults.reduce((s, r) => s + (r.score || 0), 0) / allResults.length) : null;
  const ungradedCount = exams.flatMap(e => e.results.filter(r => r.score == null)).length;
  const now = new Date();

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>🧪 {t("exams.title")}</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{t("exams.scheduleAndResults")}</p>
        </div>
        <a href="/teacher/exams/new" className="btn btn-primary">+ {t("exams.scheduleExam")}</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("exams.totalExams"), value: totalExams, icon: "📋", color: "var(--primary, #6366f1)", bg: "var(--primary-light, #ede9fe)" },
          { label: t("exams.gradedCount"), value: `${allResults.length} graded`, icon: "✅", color: "#10b981", bg: "#d1fae5" },
          { label: t("exams.averageScore"), value: avgScore !== null ? `${avgScore}%` : "—", icon: "⭐", color: "#f59e0b", bg: "#fef3c7" },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {ungradedCount > 0 && (
        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span>⚠️</span>
          <span style={{ fontSize: "0.875rem", color: "#92400e", fontWeight: "500" }}>{ungradedCount} results pending grades</span>
        </div>
      )}

      {loading ? <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>{t("common.loading")}</div>
        : exams.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🧪</div>
          <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>{t("exams.noExamsYet")}</div>
          <a href="/teacher/exams/new" className="btn btn-primary" style={{ display: "inline-flex" }}>+ {t("exams.scheduleFirst")}</a>
        </div>
      ) : (
        <div>
          {["upcoming","past"].map(section => {
            const sectionExams = section === "upcoming"
              ? exams.filter(e => new Date(e.scheduledAt) >= now)
              : exams.filter(e => new Date(e.scheduledAt) < now);
            if (!sectionExams.length) return null;
            return (
              <div key={section} style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                  {section === "upcoming" ? `🔜 ${t("exams.upcoming")}` : `📚 ${t("exams.past")}`}
                </h2>
                {sectionExams.map(exam => {
                  const isExpanded = expandedId === exam.id;
                  const graded = exam.results.filter(r => r.score != null);
                  return (
                    <div key={exam.id} className="card" style={{ marginBottom: "0.875rem", padding: 0, overflow: "hidden" }}>
                      <div style={{ padding: "1.25rem 1.5rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setExpandedId(isExpanded ? null : exam.id)}>
                        <div>
                          <div style={{ fontWeight: "700", color: "#1e293b" }}>{exam.title}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.125rem" }}>
                            {exam.group.name} · {new Date(exam.scheduledAt).toLocaleString()} · Max: {exam.maxScore}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "9999px", background: "#d1fae5", color: "#065f46", fontSize: "0.72rem", fontWeight: "700" }}>
                            {graded.length}/{exam.results.length} {t("exams.gradedCount")}
                          </span>
                          <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {isExpanded && exam.results.length > 0 && (
                        <div style={{ borderTop: "1px solid #f1f5f9" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ background: "#f8fafc" }}>
                                {[t("students.student"), `${t("grades.score")} (/${exam.maxScore})`, "%", t("homework.feedback")].map(h => (
                                  <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {exam.results.map((r, i) => {
                                const pct = r.score != null ? Math.round((r.score / exam.maxScore) * 100) : null;
                                return (
                                  <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                                    <td style={{ padding: "0.75rem 1rem", fontWeight: "500", fontSize: "0.875rem" }}>{r.student.user.firstName} {r.student.user.lastName}</td>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                      <input
                                        type="number" min={0} max={exam.maxScore}
                                        placeholder={r.score != null ? String(r.score) : "—"}
                                        value={scoreInputs[r.id]?.score ?? ""}
                                        onChange={e => setScoreInputs(prev => ({ ...prev, [r.id]: { ...prev[r.id], score: e.target.value, feedback: prev[r.id]?.feedback || "" } }))}
                                        style={{ width: "70px", padding: "0.3rem 0.5rem", border: "1px solid #e2e8f0", borderRadius: "0.375rem", fontSize: "0.875rem" }}
                                      />
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                      {pct !== null ? (
                                        <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: "700", background: pct >= 70 ? "#d1fae5" : pct >= 50 ? "#fef3c7" : "#fee2e2", color: pct >= 70 ? "#065f46" : pct >= 50 ? "#92400e" : "#dc2626" }}>{pct}%</span>
                                      ) : "—"}
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                      <input
                                        type="text"
                                        placeholder={r.feedback || "—"}
                                        value={scoreInputs[r.id]?.feedback ?? ""}
                                        onChange={e => setScoreInputs(prev => ({ ...prev, [r.id]: { ...prev[r.id], feedback: e.target.value, score: prev[r.id]?.score || "" } }))}
                                        style={{ width: "180px", padding: "0.3rem 0.5rem", border: "1px solid #e2e8f0", borderRadius: "0.375rem", fontSize: "0.875rem" }}
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => saveResults(exam.id)} disabled={saving} className="btn btn-primary">
                              {saving ? t("exams.saving") : t("exams.saveResults")}
                            </button>
                          </div>
                        </div>
                      )}
                      {isExpanded && exam.results.length === 0 && (
                        <div style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>No students enrolled yet.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

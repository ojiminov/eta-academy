"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type HWGrade = {
  id: string; status: string; score?: number; feedback?: string;
  submittedAt?: string; submissionUrl?: string; submissionName?: string;
  student: { user: { firstName: string; lastName: string } };
  homework: { id: string; title: string; dueDate: string; maxScore: number; group: { name: string } };
};
type Homework = {
  id: string; title: string; description?: string; dueDate: string; returnDate?: string; maxScore: number;
  group: { name: string };
  grades: HWGrade[];
};

export default function TeacherHomeworkPage() {
  const t = useTranslations();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { score: string; feedback: string }>>({});
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/teacher/homework").then(r => r.json()).then(setHomeworks).finally(() => setLoading(false));
  }, []);

  async function saveGrades(hwId: string) {
    setSaving(true);
    const updates = Object.entries(gradeInputs)
      .filter(([, v]) => v.score !== "")
      .map(([gradeId, v]) => ({ gradeId, score: Number(v.score), feedback: v.feedback }));
    await fetch("/api/teacher/homework", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ homeworkId: hwId, grades: updates }) });
    const data = await fetch("/api/teacher/homework").then(r => r.json());
    setHomeworks(data);
    setGradeInputs({});
    setSaving(false);
  }

  async function assignToAll(hwId: string) {
    setAssigning(hwId);
    await fetch("/api/teacher/homework", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assignAll", homeworkId: hwId }) });
    const data = await fetch("/api/teacher/homework").then(r => r.json());
    setHomeworks(data);
    setAssigning(null);
  }

  const total = homeworks.length;
  const pendingGrades = homeworks.reduce((s, hw) => s + hw.grades.filter(g => g.status === "SUBMITTED").length, 0);
  const allGrades = homeworks.flatMap(hw => hw.grades.filter(g => g.score != null));
  const avgScore = allGrades.length > 0 ? Math.round(allGrades.reduce((s, g) => s + (g.score || 0), 0) / allGrades.length) : null;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>📋 {t("homework.title")}</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{t("homework.assignAndGrade")}</p>
        </div>
        <a href="/teacher/homework/new" className="btn btn-primary">+ {t("homework.assignHomework")}</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("homework.total"), value: total, icon: "📋", color: "var(--primary, #6366f1)", bg: "var(--primary-light, #ede9fe)" },
          { label: t("payments.pending"), value: pendingGrades, icon: "⏳", color: pendingGrades > 0 ? "#f59e0b" : "#10b981", bg: pendingGrades > 0 ? "#fef3c7" : "#d1fae5" },
          { label: t("homework.graded"), value: avgScore !== null ? `${avgScore}%` : "—", icon: "⭐", color: "#10b981", bg: "#d1fae5" },
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

      {loading ? <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>{t("common.loading")}</div>
        : homeworks.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📋</div>
          <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>{t("homework.noHomework")}</div>
          <a href="/teacher/homework/new" className="btn btn-primary" style={{ display: "inline-flex" }}>+ {t("homework.assignFirst")}</a>
        </div>
      ) : homeworks.map(hw => {
        const isExpanded = expandedId === hw.id;
        const submitted = hw.grades.filter(g => g.status === "SUBMITTED");
        const graded = hw.grades.filter(g => g.status === "GRADED");
        const unassigned = hw.grades.length === 0;
        return (
          <div key={hw.id} className="card" style={{ marginBottom: "1rem", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setExpandedId(isExpanded ? null : hw.id)}>
              <div>
                <div style={{ fontWeight: "700", color: "#1e293b" }}>{hw.title}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.125rem" }}>
                  {hw.group.name} · {t("homework.dueDate")}: {new Date(hw.dueDate).toLocaleDateString()} · {t("homework.maxScore")}: {hw.maxScore} {t("homework.pts")}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {submitted.length > 0 && <span style={{ padding: "0.2rem 0.5rem", borderRadius: "9999px", background: "#dbeafe", color: "#1e40af", fontSize: "0.72rem", fontWeight: "700" }}>{submitted.length} {t("homework.statusSUBMITTED")}</span>}
                {graded.length > 0 && <span style={{ padding: "0.2rem 0.5rem", borderRadius: "9999px", background: "#d1fae5", color: "#065f46", fontSize: "0.72rem", fontWeight: "700" }}>{graded.length} {t("homework.statusGRADED")}</span>}
                <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {isExpanded && (
              <div style={{ borderTop: "1px solid #f1f5f9" }}>
                {unassigned ? (
                  <div style={{ padding: "1.5rem", textAlign: "center" }}>
                    <p style={{ color: "#64748b", marginBottom: "1rem" }}>{t("homework.assignFirst")}</p>
                    <button onClick={() => assignToAll(hw.id)} disabled={assigning === hw.id} className="btn btn-primary">
                      {assigning === hw.id ? t("homework.assigning") : t("homework.assignHomework")}
                    </button>
                  </div>
                ) : (
                  <div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {[t("students.student"), t("common.status"), t("homework.submittedAt"), `${t("homework.graded")} (/${hw.maxScore})`, t("homework.feedback")].map(h => (
                            <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hw.grades.map((g, i) => (
                          <tr key={g.id} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: "500", fontSize: "0.875rem" }}>{g.student.user.firstName} {g.student.user.lastName}</td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "700",
                                background: g.status === "GRADED" ? "#d1fae5" : g.status === "SUBMITTED" ? "#dbeafe" : g.status === "LATE" ? "#fee2e2" : "#fef3c7",
                                color: g.status === "GRADED" ? "#065f46" : g.status === "SUBMITTED" ? "#1e40af" : g.status === "LATE" ? "#dc2626" : "#92400e" }}>
                                {g.status}
                              </span>
                            </td>
                            <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#64748b" }}>
                              {g.submissionUrl ? (
                                <a href={g.submissionUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1", fontWeight: "600", textDecoration: "none" }}>
                                  📎 {g.submissionName || t("common.view")}
                                </a>
                              ) : g.submittedAt ? new Date(g.submittedAt).toLocaleDateString() : "—"}
                            </td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <input
                                type="number" min={0} max={hw.maxScore}
                                placeholder={g.score != null ? String(g.score) : "—"}
                                value={gradeInputs[g.id]?.score ?? ""}
                                onChange={e => setGradeInputs(prev => ({ ...prev, [g.id]: { ...prev[g.id], score: e.target.value, feedback: prev[g.id]?.feedback || "" } }))}
                                style={{ width: "70px", padding: "0.3rem 0.5rem", border: "1px solid #e2e8f0", borderRadius: "0.375rem", fontSize: "0.875rem" }}
                              />
                            </td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <input
                                type="text"
                                placeholder={g.feedback || "—"}
                                value={gradeInputs[g.id]?.feedback ?? ""}
                                onChange={e => setGradeInputs(prev => ({ ...prev, [g.id]: { ...prev[g.id], feedback: e.target.value, score: prev[g.id]?.score || "" } }))}
                                style={{ width: "160px", padding: "0.3rem 0.5rem", border: "1px solid #e2e8f0", borderRadius: "0.375rem", fontSize: "0.875rem" }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => saveGrades(hw.id)} disabled={saving} className="btn btn-primary">
                        {saving ? t("homework.saving") : t("homework.saveGrades")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HomeworkGrade = { studentId: string; student: { user: { firstName: string; lastName: string } }; status: string; score?: number; feedback?: string; };
type Homework = { id: string; title: string; description?: string; dueDate: string; returnDate?: string; maxScore: number; group: { name: string }; teacher: { user: { firstName: string; lastName: string } }; grades: HomeworkGrade[]; };

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ASSIGNED: { bg: "#fef3c7", color: "#b45309" },
  SUBMITTED: { bg: "#dbeafe", color: "#1e40af" },
  GRADED: { bg: "#dcfce7", color: "#16a34a" },
  LATE: { bg: "#fee2e2", color: "#dc2626" },
};

export default function TeacherHomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Homework | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { score: string; feedback: string }>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/teacher/homeworks");
    if (res.ok) setHomeworks(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openGrading(hw: Homework) {
    setSelected(hw);
    const inputs: Record<string, { score: string; feedback: string }> = {};
    hw.grades.forEach(g => { inputs[g.studentId] = { score: g.score?.toString() ?? "", feedback: g.feedback ?? "" }; });
    setGradeInputs(inputs);
  }

  async function saveGrades() {
    if (!selected) return;
    setSaving(true);
    const grades = Object.entries(gradeInputs).map(([studentId, v]) => ({
      studentId, score: v.score ? parseFloat(v.score) : undefined, feedback: v.feedback, status: v.score ? "GRADED" : "SUBMITTED",
    }));
    await fetch(`/api/teacher/homeworks/${selected.id}/grades`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grades }) });
    setSaving(false);
    setSelected(null);
    await load();
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>Homework</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>Assign and grade homework for your groups</p>
        </div>
        <Link href="/teacher/homework/new" className="btn btn-primary" style={{ gap: "0.375rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Assign Homework
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading...</div>
      ) : homeworks.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>📋</div>
          <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "0.375rem" }}>No homework assigned yet</div>
          <Link href="/teacher/homework/new" style={{ color: "var(--primary, #6366f1)", fontWeight: "600", textDecoration: "none", fontSize: "0.875rem" }}>Assign your first homework →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {homeworks.map(hw => {
            const graded = hw.grades.filter(g => g.status === "GRADED").length;
            const total = hw.grades.length;
            const avgScore = graded > 0 ? hw.grades.filter(g => g.score != null).reduce((s, g) => s + (g.score || 0), 0) / (hw.grades.filter(g => g.score != null).length || 1) : 0;
            const overdue = new Date(hw.dueDate) < new Date();
            return (
              <div key={hw.id} style={{
                background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem",
                padding: "1.25rem 1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "700", fontSize: "0.9375rem", color: "#0f172a" }}>{hw.title}</span>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", background: "#ede9fe", color: "#5b21b6", fontSize: "0.7rem", fontWeight: "600" }}>{hw.group.name}</span>
                    {overdue && <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", background: "#fee2e2", color: "#dc2626", fontSize: "0.7rem", fontWeight: "600" }}>OVERDUE</span>}
                  </div>
                  <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.78rem", color: "#64748b", flexWrap: "wrap" }}>
                    <span>📅 Due: {new Date(hw.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    {hw.returnDate && <span>↩️ Return: {new Date(hw.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                    <span>Max: {hw.maxScore} pts</span>
                    <span style={{ color: graded === total && total > 0 ? "#10b981" : "#64748b" }}>✅ {graded}/{total} graded</span>
                    {graded > 0 && <span>⭐ Avg: {avgScore.toFixed(1)}</span>}
                  </div>
                </div>
                <button onClick={() => openGrading(hw)} style={{ padding: "0.5rem 1.125rem", background: "var(--primary, #6366f1)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem", flexShrink: 0 }}>
                  Grade
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Grading Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "1.25rem", padding: "2rem", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{selected.title}</h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>{selected.group.name} · Max {selected.maxScore} pts</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", color: "#64748b", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {selected.grades.map(g => (
                <div key={g.studentId} style={{ display: "grid", gridTemplateColumns: "1fr 110px 1fr", gap: "0.75rem", alignItems: "center", padding: "0.875rem", background: "#f8fafc", borderRadius: "0.625rem" }}>
                  <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "0.875rem" }}>{g.student.user.firstName} {g.student.user.lastName}</div>
                  <input type="number" min="0" max={selected.maxScore} placeholder={`/${selected.maxScore}`}
                    value={gradeInputs[g.studentId]?.score || ""}
                    onChange={e => setGradeInputs(prev => ({ ...prev, [g.studentId]: { ...prev[g.studentId], score: e.target.value } }))}
                    className="input" style={{ textAlign: "center", padding: "0.375rem 0.5rem", minHeight: "36px" }} />
                  <input type="text" placeholder="Feedback..."
                    value={gradeInputs[g.studentId]?.feedback || ""}
                    onChange={e => setGradeInputs(prev => ({ ...prev, [g.studentId]: { ...prev[g.studentId], feedback: e.target.value } }))}
                    className="input" style={{ padding: "0.375rem 0.5rem", minHeight: "36px" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={saveGrades} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                {saving ? "Saving..." : "Save Grades"}
              </button>
              <button onClick={() => setSelected(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

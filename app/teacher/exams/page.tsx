"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type ExamResult = { studentId: string; student: { user: { firstName: string; lastName: string } }; score?: number; feedback?: string; };
type Exam = { id: string; title: string; description?: string; scheduledAt: string; duration?: number; maxScore: number; group: { name: string }; results: ExamResult[]; };

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [resultInputs, setResultInputs] = useState<Record<string, { score: string; feedback: string }>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/teacher/exams");
    if (res.ok) setExams(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openResults(exam: Exam) {
    setSelected(exam);
    const inputs: Record<string, { score: string; feedback: string }> = {};
    exam.results.forEach(r => { inputs[r.studentId] = { score: r.score?.toString() ?? "", feedback: r.feedback ?? "" }; });
    setResultInputs(inputs);
  }

  async function saveResults() {
    if (!selected) return;
    setSaving(true);
    const results = Object.entries(resultInputs).map(([studentId, v]) => ({ studentId, score: v.score ? parseFloat(v.score) : undefined, feedback: v.feedback }));
    await fetch(`/api/teacher/exams/${selected.id}/results`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results }) });
    setSaving(false);
    setSelected(null);
    await load();
  }

  const leaderboard = useMemo(() =>
    selected
      ? [...selected.results].filter(r => r.score != null).sort((a, b) => (b.score || 0) - (a.score || 0) || a.student.user.firstName.localeCompare(b.student.user.firstName))
      : [],
    [selected]
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>Exams</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>Schedule exams and enter student results</p>
        </div>
        <Link href="/teacher/exams/new" className="btn btn-primary" style={{ gap: "0.375rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Schedule Exam
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading...</div>
      ) : exams.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>🧪</div>
          <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "0.375rem" }}>No exams scheduled</div>
          <Link href="/teacher/exams/new" style={{ color: "var(--primary, #6366f1)", fontWeight: "600", textDecoration: "none", fontSize: "0.875rem" }}>Schedule your first exam →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {exams.map(exam => {
            const graded = exam.results.filter(r => r.score != null).length;
            const avg = graded > 0 ? exam.results.filter(r => r.score != null).reduce((s, r) => s + (r.score || 0), 0) / graded : 0;
            const isPast = new Date(exam.scheduledAt) < new Date();
            return (
              <div key={exam.id} style={{
                background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem",
                padding: "1.25rem 1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "700", fontSize: "0.9375rem", color: "#0f172a" }}>{exam.title}</span>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", background: "#ede9fe", color: "#5b21b6", fontSize: "0.7rem", fontWeight: "600" }}>{exam.group.name}</span>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600", background: isPast ? "#dcfce7" : "#fef3c7", color: isPast ? "#16a34a" : "#b45309" }}>
                      {isPast ? "Past" : "Upcoming"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.78rem", color: "#64748b", flexWrap: "wrap" }}>
                    <span>📅 {new Date(exam.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                    {exam.duration && <span>⏱️ {exam.duration} min</span>}
                    <span>Max: {exam.maxScore} pts</span>
                    <span style={{ color: graded === exam.results.length && exam.results.length > 0 ? "#10b981" : "#64748b" }}>
                      ✅ {graded}/{exam.results.length} graded
                    </span>
                    {graded > 0 && <span>⭐ Avg: {avg.toFixed(1)}</span>}
                  </div>
                </div>
                {isPast && (
                  <button onClick={() => openResults(exam)} style={{ padding: "0.5rem 1.125rem", background: "var(--primary, #6366f1)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem", flexShrink: 0 }}>
                    Results
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Results modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "1.25rem", padding: "2rem", width: "100%", maxWidth: "680px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{selected.title} — Results</h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>{selected.group.name} · Max {selected.maxScore} pts</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", color: "#64748b", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div style={{ marginBottom: "1.5rem", padding: "1rem 1.25rem", background: "#f8fafc", borderRadius: "0.875rem", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: "700", color: "#0f172a", marginBottom: "0.875rem", fontSize: "0.875rem" }}>🏆 Leaderboard</div>
                {leaderboard.map((r, i) => {
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                  const pct = Math.round(((r.score || 0) / selected.maxScore) * 100);
                  return (
                    <div key={r.studentId} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <span style={{ width: "24px", textAlign: "center", fontSize: medal ? "1rem" : "0.75rem", fontWeight: "700", color: "#64748b" }}>
                        {medal || i + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: "#0f172a" }}>{r.student.user.firstName} {r.student.user.lastName}</span>
                      <span style={{ fontWeight: "700", fontSize: "0.875rem", color: pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444" }}>
                        {r.score}/{selected.maxScore}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {selected.results.map(r => (
                <div key={r.studentId} style={{ display: "grid", gridTemplateColumns: "1fr 110px 1fr", gap: "0.75rem", alignItems: "center", padding: "0.875rem", background: "#f8fafc", borderRadius: "0.625rem" }}>
                  <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "0.875rem" }}>{r.student.user.firstName} {r.student.user.lastName}</div>
                  <input type="number" min="0" max={selected.maxScore} placeholder={`/${selected.maxScore}`}
                    value={resultInputs[r.studentId]?.score || ""}
                    onChange={e => setResultInputs(prev => ({ ...prev, [r.studentId]: { ...prev[r.studentId], score: e.target.value } }))}
                    className="input" style={{ textAlign: "center", padding: "0.375rem 0.5rem", minHeight: "36px" }} />
                  <input type="text" placeholder="Feedback..."
                    value={resultInputs[r.studentId]?.feedback || ""}
                    onChange={e => setResultInputs(prev => ({ ...prev, [r.studentId]: { ...prev[r.studentId], feedback: e.target.value } }))}
                    className="input" style={{ padding: "0.375rem 0.5rem", minHeight: "36px" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={saveResults} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                {saving ? "Saving..." : "Save Results"}
              </button>
              <button onClick={() => setSelected(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

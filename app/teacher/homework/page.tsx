"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HomeworkGrade = { studentId: string; student: { user: { firstName: string; lastName: string } }; status: string; score?: number; feedback?: string; };
type Homework = { id: string; title: string; description?: string; dueDate: string; returnDate?: string; maxScore: number; group: { name: string }; teacher: { user: { firstName: string; lastName: string } }; grades: HomeworkGrade[]; };

const STATUS_COLORS: Record<string, string> = { ASSIGNED:"#f59e0b", SUBMITTED:"var(--primary, #6366f1)", GRADED:"#10b981", LATE:"#ef4444" };

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
    await fetch(`/api/teacher/homeworks/${selected.id}/grades`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ grades }) });
    setSaving(false);
    setSelected(null);
    await load();
  }

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"2rem" }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>📋 Homework</h1>
          <p style={{ color:"#64748b", margin:0 }}>Assign and grade homework for your groups</p>
        </div>
        <Link href="/teacher/homework/new" style={{ background:"var(--primary-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))", color:"white", borderRadius:"0.5rem", padding:"0.625rem 1.25rem", fontWeight:"600", textDecoration:"none", fontSize:"0.875rem" }}>
          + Assign Homework
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>Loading...</div>
      ) : homeworks.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>📋</div>
          <div style={{ fontWeight:"600", color:"#1e293b", marginBottom:"0.5rem" }}>No homework assigned yet</div>
          <Link href="/teacher/homework/new" style={{ color:"var(--primary, #6366f1)", fontWeight:"600" }}>Assign your first homework →</Link>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {homeworks.map(hw => {
            const graded = hw.grades.filter(g => g.status === "GRADED").length;
            const total = hw.grades.length;
            const avgScore = total > 0 ? hw.grades.filter(g=>g.score!=null).reduce((s,g)=>s+(g.score||0),0) / (hw.grades.filter(g=>g.score!=null).length||1) : 0;
            const overdue = new Date(hw.dueDate) < new Date();
            return (
              <div key={hw.id} className="card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"1rem" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.25rem" }}>
                    <span style={{ fontWeight:"700", fontSize:"1rem", color:"#1e293b" }}>{hw.title}</span>
                    <span style={{ padding:"0.125rem 0.5rem", borderRadius:"9999px", background:"#ede9fe", color:"var(--primary, #6366f1)", fontSize:"0.7rem", fontWeight:"600" }}>{hw.group.name}</span>
                    {overdue && <span style={{ padding:"0.125rem 0.5rem", borderRadius:"9999px", background:"#fee2e2", color:"#dc2626", fontSize:"0.7rem", fontWeight:"600" }}>OVERDUE</span>}
                  </div>
                  <div style={{ display:"flex", gap:"1.5rem", fontSize:"0.8rem", color:"#64748b" }}>
                    <span>📅 Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                    {hw.returnDate && <span>↩️ Return: {new Date(hw.returnDate).toLocaleDateString()}</span>}
                    <span>Max: {hw.maxScore} pts</span>
                    <span>✅ Graded: {graded}/{total}</span>
                    {graded > 0 && <span>⭐ Avg: {avgScore.toFixed(1)}</span>}
                  </div>
                </div>
                <button onClick={() => openGrading(hw)} style={{ padding:"0.5rem 1rem", background:"var(--primary, #6366f1)", color:"white", border:"none", borderRadius:"0.5rem", cursor:"pointer", fontWeight:"600", fontSize:"0.8rem" }}>
                  Grade
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Grading Modal */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:"1rem", padding:"2rem", width:"100%", maxWidth:"600px", maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1.5rem" }}>
              <h2 style={{ fontSize:"1.1rem", fontWeight:"700", color:"#1e293b" }}>📝 {selected.title} — {selected.group.name}</h2>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", fontSize:"1.5rem", cursor:"pointer", color:"#64748b" }}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {selected.grades.map(g => (
                <div key={g.studentId} style={{ display:"grid", gridTemplateColumns:"1fr 120px 1fr", gap:"0.75rem", alignItems:"center", padding:"0.75rem", background:"#f8fafc", borderRadius:"0.5rem" }}>
                  <div style={{ fontWeight:"600", color:"#1e293b" }}>{g.student.user.firstName} {g.student.user.lastName}</div>
                  <input type="number" min="0" max={selected.maxScore} placeholder={`/${selected.maxScore}`}
                    value={gradeInputs[g.studentId]?.score || ""}
                    onChange={e => setGradeInputs(prev => ({ ...prev, [g.studentId]: { ...prev[g.studentId], score: e.target.value } }))}
                    style={{ padding:"0.375rem 0.5rem", border:"1px solid #e2e8f0", borderRadius:"0.375rem", fontSize:"0.875rem", textAlign:"center" }} />
                  <input type="text" placeholder="Feedback..."
                    value={gradeInputs[g.studentId]?.feedback || ""}
                    onChange={e => setGradeInputs(prev => ({ ...prev, [g.studentId]: { ...prev[g.studentId], feedback: e.target.value } }))}
                    style={{ padding:"0.375rem 0.5rem", border:"1px solid #e2e8f0", borderRadius:"0.375rem", fontSize:"0.875rem" }} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:"0.75rem", marginTop:"1.5rem" }}>
              <button onClick={saveGrades} disabled={saving} style={{ flex:1, padding:"0.75rem", background:"var(--primary-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))", color:"white", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor: saving?"not-allowed":"pointer" }}>
                {saving ? "Saving..." : "Save Grades"}
              </button>
              <button onClick={() => setSelected(null)} style={{ flex:1, padding:"0.75rem", background:"#f1f5f9", color:"#475569", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

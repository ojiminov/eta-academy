"use client";

import { useEffect, useState } from "react";
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
    await fetch(`/api/teacher/exams/${selected.id}/results`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ results }) });
    setSaving(false); setSelected(null); await load();
  }

  // Leaderboard for selected
  const leaderboard = selected ? [...selected.results].filter(r=>r.score!=null).sort((a,b)=>(b.score||0)-(a.score||0)) : [];

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"2rem" }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>🧪 Exams</h1>
          <p style={{ color:"#64748b", margin:0 }}>Schedule exams and enter student results</p>
        </div>
        <Link href="/teacher/exams/new" style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", borderRadius:"0.5rem", padding:"0.625rem 1.25rem", fontWeight:"600", textDecoration:"none", fontSize:"0.875rem" }}>
          + Schedule Exam
        </Link>
      </div>

      {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>Loading...</div>
        : exams.length === 0 ? (
          <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
            <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>🧪</div>
            <div style={{ fontWeight:"600", color:"#1e293b", marginBottom:"0.5rem" }}>No exams scheduled</div>
            <Link href="/teacher/exams/new" style={{ color:"#6366f1", fontWeight:"600" }}>Schedule your first exam →</Link>
          </div>
        ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {exams.map(exam => {
            const graded = exam.results.filter(r=>r.score!=null).length;
            const avg = graded > 0 ? exam.results.filter(r=>r.score!=null).reduce((s,r)=>s+(r.score||0),0)/graded : 0;
            const isPast = new Date(exam.scheduledAt) < new Date();
            return (
              <div key={exam.id} className="card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"1rem" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.25rem" }}>
                    <span style={{ fontWeight:"700", color:"#1e293b" }}>{exam.title}</span>
                    <span style={{ padding:"0.125rem 0.5rem", borderRadius:"9999px", background:"#ede9fe", color:"#6366f1", fontSize:"0.7rem", fontWeight:"600" }}>{exam.group.name}</span>
                    <span style={{ padding:"0.125rem 0.5rem", borderRadius:"9999px", background: isPast?"#d1fae5":"#fef3c7", color:isPast?"#065f46":"#92400e", fontSize:"0.7rem", fontWeight:"600" }}>{isPast?"Past":"Upcoming"}</span>
                  </div>
                  <div style={{ display:"flex", gap:"1.5rem", fontSize:"0.8rem", color:"#64748b" }}>
                    <span>📅 {new Date(exam.scheduledAt).toLocaleString()}</span>
                    {exam.duration && <span>⏱️ {exam.duration} min</span>}
                    <span>Max: {exam.maxScore}</span>
                    <span>✅ {graded}/{exam.results.length} graded</span>
                    {graded > 0 && <span>⭐ Avg: {avg.toFixed(1)}</span>}
                  </div>
                </div>
                {isPast && (
                  <button onClick={() => openResults(exam)} style={{ padding:"0.5rem 1rem", background:"#6366f1", color:"white", border:"none", borderRadius:"0.5rem", cursor:"pointer", fontWeight:"600", fontSize:"0.8rem" }}>
                    Results
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Results + Leaderboard Modal */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:"1rem", padding:"2rem", width:"100%", maxWidth:"680px", maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1.5rem" }}>
              <h2 style={{ fontSize:"1.1rem", fontWeight:"700", color:"#1e293b" }}>🧪 {selected.title} — Results</h2>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", fontSize:"1.5rem", cursor:"pointer", color:"#64748b" }}>✕</button>
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div style={{ marginBottom:"1.5rem", padding:"1rem", background:"#f8fafc", borderRadius:"0.75rem" }}>
                <div style={{ fontWeight:"600", color:"#1e293b", marginBottom:"0.75rem" }}>🏆 Current Leaderboard</div>
                {leaderboard.map((r, i) => (
                  <div key={r.studentId} style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.375rem" }}>
                    <span style={{ width:24, height:24, borderRadius:"50%", display:"flex",alignItems:"center",justifyContent:"center", background:i===0?"#fef3c7":i===1?"#f1f5f9":i===2?"#fef0e7":"transparent", fontSize:"0.75rem", fontWeight:"700", color:i===0?"#d97706":i===1?"#475569":i===2?"#ea580c":"#64748b" }}>
                      {i+1}
                    </span>
                    <span style={{ flex:1, fontSize:"0.875rem", fontWeight:500 }}>{r.student.user.firstName} {r.student.user.lastName}</span>
                    <span style={{ fontWeight:"700", color:((r.score||0)/selected.maxScore)>=0.7?"#10b981":((r.score||0)/selected.maxScore)>=0.5?"#f59e0b":"#ef4444" }}>
                      {r.score}/{selected.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {selected.results.map(r => (
                <div key={r.studentId} style={{ display:"grid", gridTemplateColumns:"1fr 120px 1fr", gap:"0.75rem", alignItems:"center", padding:"0.75rem", background:"#f8fafc", borderRadius:"0.5rem" }}>
                  <div style={{ fontWeight:"600", color:"#1e293b" }}>{r.student.user.firstName} {r.student.user.lastName}</div>
                  <input type="number" min="0" max={selected.maxScore} placeholder={`/${selected.maxScore}`}
                    value={resultInputs[r.studentId]?.score || ""}
                    onChange={e => setResultInputs(prev => ({ ...prev, [r.studentId]: { ...prev[r.studentId], score: e.target.value } }))}
                    style={{ padding:"0.375rem 0.5rem", border:"1px solid #e2e8f0", borderRadius:"0.375rem", fontSize:"0.875rem", textAlign:"center" }} />
                  <input type="text" placeholder="Feedback..."
                    value={resultInputs[r.studentId]?.feedback || ""}
                    onChange={e => setResultInputs(prev => ({ ...prev, [r.studentId]: { ...prev[r.studentId], feedback: e.target.value } }))}
                    style={{ padding:"0.375rem 0.5rem", border:"1px solid #e2e8f0", borderRadius:"0.375rem", fontSize:"0.875rem" }} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:"0.75rem", marginTop:"1.5rem" }}>
              <button onClick={saveResults} disabled={saving} style={{ flex:1, padding:"0.75rem", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor: saving?"not-allowed":"pointer" }}>
                {saving ? "Saving..." : "Save Results"}
              </button>
              <button onClick={() => setSelected(null)} style={{ flex:1, padding:"0.75rem", background:"#f1f5f9", color:"#475569", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

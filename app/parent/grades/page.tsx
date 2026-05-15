"use client";

import { useEffect, useState } from "react";

type ChildData = {
  parent: {
    student: {
      grades: { score: number; maxScore: number; label?: string; createdAt: string }[];
      homeworkGrades: { status: string; score?: number; feedback?: string; homework: { title: string; dueDate: string; group: { name: string } } }[];
      examResults: { score?: number; feedback?: string; exam: { title: string; maxScore: number; scheduledAt: string; group: { name: string } } }[];
    };
  };
};

export default function ParentGradesPage() {
  const [data, setData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"grades"|"homework"|"exams">("grades");

  useEffect(() => {
    fetch("/api/parent/child").then(r=>r.json()).then(setData).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>Loading...</div>;
  if (!data) return null;
  const child = data.parent.student;
  const grades = child.grades;
  const hwGrades = child.homeworkGrades;
  const exams = child.examResults;
  const avgGrade = grades.length > 0 ? Math.round(grades.reduce((s,g)=>s+(g.score/g.maxScore)*100,0)/grades.length) : null;

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>📝 Grades & Tests</h1>
        <p style={{ color:"#64748b", margin:0 }}>Academic performance overview</p>
      </div>

      {avgGrade !== null && (
        <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:"1rem", padding:"1.25rem 1.5rem", marginBottom:"1.5rem", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"0.8rem", opacity:0.85 }}>Overall Average</div>
            <div style={{ fontSize:"2.5rem", fontWeight:"800" }}>{avgGrade}%</div>
          </div>
          <div style={{ fontSize:"4rem" }}>{avgGrade>=90?"🌟":avgGrade>=70?"👍":avgGrade>=50?"📚":"⚠️"}</div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
        {(["grades","homework","exams"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"0.5rem 1.25rem", borderRadius:"9999px", border:"2px solid", borderColor:tab===t?"#6366f1":"#e2e8f0", background:tab===t?"#6366f1":"white", color:tab===t?"white":"#475569", fontSize:"0.875rem", fontWeight:"600", cursor:"pointer" }}>
            {t==="grades"?"📝 Grades":t==="homework"?"📋 Homework":"🧪 Exams"}
          </button>
        ))}
      </div>

      {tab==="grades" && (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Date","Assignment","Score","Percentage"].map(h=>(
                  <th key={h} style={{ padding:"0.75rem 1rem", textAlign:"left", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", textTransform:"uppercase", borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grades.map((g,i)=>{
                const pct = Math.round((g.score/g.maxScore)*100);
                return (
                  <tr key={i} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"white":"#fafafa" }}>
                    <td style={{ padding:"0.875rem 1rem", fontSize:"0.875rem", color:"#64748b" }}>{new Date(g.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding:"0.875rem 1rem", fontWeight:"500" }}>{g.label||"—"}</td>
                    <td style={{ padding:"0.875rem 1rem", fontWeight:"700" }}>{g.score}/{g.maxScore}</td>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      <span style={{ padding:"0.25rem 0.625rem", borderRadius:"9999px", fontSize:"0.75rem", fontWeight:"700", background:pct>=70?"#d1fae5":pct>=50?"#fef3c7":"#fee2e2", color:pct>=70?"#065f46":pct>=50?"#92400e":"#991b1b" }}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {grades.length===0 && <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>No grades yet</div>}
        </div>
      )}

      {tab==="homework" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {hwGrades.length===0 ? <div className="card" style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>No homework yet</div>
            : hwGrades.map((h,i)=>(
            <div key={i} className="card" style={{ borderLeft:`4px solid ${h.status==="GRADED"?"#10b981":h.status==="LATE"?"#ef4444":"#f59e0b"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:"600", color:"#1e293b" }}>{h.homework.title}</div>
                  <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{h.homework.group.name} • Due: {new Date(h.homework.dueDate).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  {h.score!=null && <div style={{ fontSize:"1.25rem", fontWeight:"700", color:"#6366f1" }}>{h.score} pts</div>}
                  <span style={{ padding:"0.25rem 0.5rem", borderRadius:"9999px", fontSize:"0.7rem", fontWeight:"700", background:h.status==="GRADED"?"#d1fae5":h.status==="LATE"?"#fee2e2":"#fef3c7", color:h.status==="GRADED"?"#065f46":h.status==="LATE"?"#dc2626":"#92400e" }}>
                    {h.status}
                  </span>
                </div>
              </div>
              {h.feedback && <div style={{ marginTop:"0.5rem", fontSize:"0.8rem", color:"#475569" }}>💬 {h.feedback}</div>}
            </div>
          ))}
        </div>
      )}

      {tab==="exams" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {exams.length===0 ? <div className="card" style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>No exams yet</div>
            : exams.map((r,i)=>{
            const pct = r.score!=null ? Math.round((r.score/r.exam.maxScore)*100) : null;
            return (
              <div key={i} className="card" style={{ borderLeft:`4px solid ${pct===null?"#e2e8f0":pct>=70?"#10b981":pct>=50?"#f59e0b":"#ef4444"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:"600", color:"#1e293b" }}>{r.exam.title}</div>
                    <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{r.exam.group.name} • {new Date(r.exam.scheduledAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {r.score!=null ? (
                      <>
                        <div style={{ fontSize:"1.5rem", fontWeight:"800", color:pct!==null&&pct>=70?"#10b981":pct!==null&&pct>=50?"#f59e0b":"#ef4444" }}>{r.score}/{r.exam.maxScore}</div>
                        <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{pct}%</div>
                      </>
                    ) : <span style={{ padding:"0.25rem 0.5rem", borderRadius:"9999px", background:"#fef3c7", color:"#92400e", fontSize:"0.75rem" }}>Pending</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

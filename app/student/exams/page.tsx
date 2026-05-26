"use client";

import { useEffect, useState } from "react";

type ExamResult = {
  id: string; score?: number; feedback?: string;
  exam: { title: string; scheduledAt: string; maxScore: number; group: { name: string }; };
};

export default function StudentExamsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/exams").then(r => r.json()).then(setResults).finally(() => setLoading(false));
  }, []);

  const graded = results.filter(r => r.score != null);
  const avg = graded.length > 0 ? graded.reduce((s,r) => s+(r.score||0), 0) / graded.length : 0;

  // Sort by score for leaderboard-like display
  const sorted = [...graded].sort((a,b) => (b.score||0)-(a.score||0));

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>🧪 My Exams</h1>
        <p style={{ color:"#64748b", margin:0 }}>Your exam schedule and results</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {[
          { label:"Total Exams", value:results.length, icon:"📋", color:"var(--primary, #6366f1)", bg:"var(--primary-light, #ede9fe)" },
          { label:"Graded", value:graded.length, icon:"✅", color:"#10b981", bg:"#d1fae5" },
          { label:"Average Score", value: graded.length > 0 ? `${avg.toFixed(1)}%` : "—", icon:"⭐", color:"#f59e0b", bg:"#fef3c7" },
        ].map(s => (
          <div key={s.label} className="card" style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <div style={{ width:44,height:44,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.25rem",flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:"1.25rem", fontWeight:"700", color:s.color }}>{s.value}</div>
              <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>Loading...</div>
        : results.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>🧪</div>
          <div style={{ fontWeight:"600", color:"#1e293b" }}>No exams yet</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {results.map(r => {
            const pct = r.score != null ? ((r.score / r.exam.maxScore) * 100) : null;
            const isPast = new Date(r.exam.scheduledAt) < new Date();
            return (
              <div key={r.id} className="card" style={{ borderLeft: `4px solid ${r.score==null?"#e2e8f0":pct!=null&&pct>=70?"#10b981":pct!=null&&pct>=50?"#f59e0b":"#ef4444"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.25rem" }}>
                      <span style={{ fontWeight:"700", color:"#1e293b" }}>{r.exam.title}</span>
                      <span style={{ padding:"0.125rem 0.5rem", borderRadius:"9999px", background:"var(--primary-light, #ede9fe)", color:"var(--primary, #6366f1)", fontSize:"0.7rem", fontWeight:"600" }}>{r.exam.group.name}</span>
                    </div>
                    <div style={{ fontSize:"0.8rem", color:"#64748b" }}>📅 {new Date(r.exam.scheduledAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {r.score != null ? (
                      <>
                        <div style={{ fontSize:"1.5rem", fontWeight:"800", color: pct!=null&&pct>=70?"#10b981":pct!=null&&pct>=50?"#f59e0b":"#ef4444" }}>
                          {r.score}/{r.exam.maxScore}
                        </div>
                        <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{pct?.toFixed(0)}%</div>
                      </>
                    ) : isPast ? (
                      <span style={{ padding:"0.25rem 0.75rem", borderRadius:"9999px", background:"#fef3c7", color:"#92400e", fontSize:"0.75rem", fontWeight:"600" }}>Pending result</span>
                    ) : (
                      <span style={{ padding:"0.25rem 0.75rem", borderRadius:"9999px", background:"#dbeafe", color:"#1e40af", fontSize:"0.75rem", fontWeight:"600" }}>Upcoming</span>
                    )}
                  </div>
                </div>
                {r.feedback && <div style={{ marginTop:"0.75rem", padding:"0.625rem", background:"#f0fdf4", borderRadius:"0.375rem", fontSize:"0.85rem", color:"#065f46" }}>💬 {r.feedback}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

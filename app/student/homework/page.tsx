"use client";

import { useEffect, useState } from "react";

type HWGrade = {
  id: string; status: string; score?: number; feedback?: string;
  homework: { title: string; description?: string; dueDate: string; returnDate?: string; maxScore: number; group: { name: string }; teacher: { user: { firstName: string; lastName: string } }; };
};

const STATUS_INFO: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  ASSIGNED:  { label:"Assigned",  bg:"#fef3c7", color:"#92400e", icon:"📋" },
  SUBMITTED: { label:"Submitted", bg:"#dbeafe", color:"#1e40af", icon:"📤" },
  GRADED:    { label:"Graded",    bg:"#d1fae5", color:"#065f46", icon:"✅" },
  LATE:      { label:"Late",      bg:"#fee2e2", color:"#991b1b", icon:"⚠️" },
};

export default function StudentHomeworkPage() {
  const [homework, setHomework] = useState<HWGrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/homework").then(r => r.json()).then(setHomework).finally(() => setLoading(false));
  }, []);

  const pending = homework.filter(h => h.status === "ASSIGNED" || h.status === "LATE");
  const graded  = homework.filter(h => h.status === "GRADED");
  const avgScore = graded.length > 0 ? graded.reduce((s,h) => s+(h.score||0), 0) / graded.length : 0;

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>📋 My Homework</h1>
        <p style={{ color:"#64748b", margin:0 }}>Track your assignments and grades</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {[
          { label:"Total", value:homework.length, icon:"📋", color:"#6366f1", bg:"#ede9fe" },
          { label:"Pending", value:pending.length, icon:"⏳", color:"#f59e0b", bg:"#fef3c7" },
          { label:"Graded", value:graded.length, icon:"✅", color:"#10b981", bg:"#d1fae5" },
          { label:"Average", value: graded.length > 0 ? `${avgScore.toFixed(1)}%` : "—", icon:"⭐", color:"#8b5cf6", bg:"#ede9fe" },
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

      {loading ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>Loading...</div>
      ) : homework.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>📋</div>
          <div style={{ fontWeight:"600", color:"#1e293b" }}>No homework assigned yet</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {homework.map(h => {
            const info = STATUS_INFO[h.status] || STATUS_INFO.ASSIGNED;
            const isOverdue = new Date(h.homework.dueDate) < new Date() && h.status === "ASSIGNED";
            const pct = h.score != null ? ((h.score / h.homework.maxScore) * 100).toFixed(0) : null;
            return (
              <div key={h.id} className="card" style={{ borderLeft:`4px solid ${info.color}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <span style={{ fontWeight:"700", fontSize:"1rem", color:"#1e293b" }}>{h.homework.title}</span>
                      <span style={{ padding:"0.125rem 0.5rem", borderRadius:"9999px", background:"#ede9fe", color:"#6366f1", fontSize:"0.7rem", fontWeight:"600" }}>{h.homework.group.name}</span>
                    </div>
                    <div style={{ fontSize:"0.8rem", color:"#64748b", marginTop:"0.25rem" }}>
                      Teacher: {h.homework.teacher.user.firstName} {h.homework.teacher.user.lastName}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{ padding:"0.25rem 0.75rem", borderRadius:"9999px", fontSize:"0.75rem", fontWeight:"700", background:info.bg, color:info.color }}>
                      {info.icon} {isOverdue ? "Overdue" : info.label}
                    </span>
                    {h.score != null && (
                      <div style={{ marginTop:"0.375rem", fontWeight:"700", color: Number(pct)>=70?"#10b981":Number(pct)>=50?"#f59e0b":"#ef4444", fontSize:"1.1rem" }}>
                        {h.score}/{h.homework.maxScore} ({pct}%)
                      </div>
                    )}
                  </div>
                </div>
                {h.homework.description && <p style={{ color:"#475569", fontSize:"0.85rem", margin:"0.25rem 0" }}>{h.homework.description}</p>}
                <div style={{ display:"flex", gap:"1.5rem", fontSize:"0.78rem", color:"#94a3b8", marginTop:"0.5rem" }}>
                  <span>📅 Due: {new Date(h.homework.dueDate).toLocaleDateString()}</span>
                  {h.homework.returnDate && <span>↩️ Return: {new Date(h.homework.returnDate).toLocaleDateString()}</span>}
                  <span>Max: {h.homework.maxScore} pts</span>
                </div>
                {h.feedback && (
                  <div style={{ marginTop:"0.75rem", padding:"0.625rem", background:"#f0fdf4", borderRadius:"0.375rem", fontSize:"0.85rem", color:"#065f46" }}>
                    💬 <strong>Teacher feedback:</strong> {h.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";

type HWGrade = {
  id: string; status: string; score?: number; feedback?: string;
  submittedAt?: string; submissionUrl?: string; submissionName?: string;
  homework: {
    title: string; description?: string; dueDate: string; returnDate?: string;
    maxScore: number; fileUrl?: string; fileName?: string;
    group: { name: string };
    teacher: { user: { firstName: string; lastName: string } };
  };
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<Record<string, { url:string; name:string; size:number }>>({});

  useEffect(() => {
    fetch("/api/student/homework").then(r => r.json()).then(setHomework).finally(() => setLoading(false));
  }, []);

  const pending = homework.filter(h => h.status === "ASSIGNED" || h.status === "LATE");
  const submitted = homework.filter(h => h.status === "SUBMITTED");
  const graded  = homework.filter(h => h.status === "GRADED");
  const avgScore = graded.length > 0 ? graded.reduce((s,h) => s+(h.score||0), 0) / graded.length : 0;

  async function handleSubmit(grade: HWGrade) {
    setSubmitting(grade.id);
    const file = uploadData[grade.id];
    const res = await fetch("/api/student/homework", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeworkGradeId: grade.id,
        submissionUrl: file?.url || null,
        submissionName: file?.name || null,
        submissionSize: file?.size || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setHomework(prev => prev.map(h => h.id === grade.id ? { ...h, ...updated } : h));
      setExpandedId(null);
    }
    setSubmitting(null);
  }

  const canSubmit = (h: HWGrade) => h.status === "ASSIGNED" || h.status === "LATE";

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>📋 My Homework</h1>
        <p style={{ color:"#64748b", margin:0 }}>Track assignments and submit your work</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {[
          { label:"Total",     value:homework.length,  icon:"📋", color:"var(--primary, #6366f1)", bg:"#ede9fe" },
          { label:"Pending",   value:pending.length,   icon:"⏳", color:"#f59e0b", bg:"#fef3c7" },
          { label:"Submitted", value:submitted.length, icon:"📤", color:"#3b82f6", bg:"#dbeafe" },
          { label:"Average",   value: graded.length > 0 ? `${avgScore.toFixed(1)}%` : "—", icon:"⭐", color:"#10b981", bg:"#d1fae5" },
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
            const isExpanded = expandedId === h.id;

            return (
              <div key={h.id} className="card" style={{ borderLeft:`4px solid ${info.color}` }}>
                {/* Header row */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
                      <span style={{ fontWeight:"700", fontSize:"1rem", color:"#1e293b" }}>{h.homework.title}</span>
                      <span style={{ padding:"0.125rem 0.5rem", borderRadius:"9999px", background:"#ede9fe", color:"var(--primary, #6366f1)", fontSize:"0.7rem", fontWeight:"600" }}>{h.homework.group.name}</span>
                    </div>
                    <div style={{ fontSize:"0.8rem", color:"#64748b", marginTop:"0.25rem" }}>
                      👩‍🏫 {h.homework.teacher.user.firstName} {h.homework.teacher.user.lastName}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
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

                {/* Dates */}
                <div style={{ display:"flex", gap:"1.5rem", fontSize:"0.78rem", color:"#94a3b8", marginTop:"0.5rem", flexWrap:"wrap" }}>
                  <span>📅 Due: {new Date(h.homework.dueDate).toLocaleDateString()}</span>
                  {h.homework.returnDate && <span>↩️ Return: {new Date(h.homework.returnDate).toLocaleDateString()}</span>}
                  <span>Max: {h.homework.maxScore} pts</span>
                </div>

                {/* Teacher's attached file */}
                {h.homework.fileUrl && h.homework.fileName && (
                  <div style={{ marginTop:"0.75rem", display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.5rem 0.75rem", background:"#f0f9ff", borderRadius:"0.5rem", border:"1px solid #bae6fd" }}>
                    <span style={{ fontSize:"1.1rem" }}>📎</span>
                    <span style={{ fontSize:"0.82rem", color:"#0369a1", fontWeight:"600", flex:1 }}>{h.homework.fileName}</span>
                    <a href={h.homework.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:"0.75rem", color:"#0284c7", fontWeight:"700", textDecoration:"none" }}>Download</a>
                  </div>
                )}

                {/* Already submitted file */}
                {h.submissionUrl && h.submissionName && (
                  <div style={{ marginTop:"0.75rem", display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.5rem 0.75rem", background:"#f0fdf4", borderRadius:"0.5rem", border:"1px solid #86efac" }}>
                    <span style={{ fontSize:"1.1rem" }}>📤</span>
                    <span style={{ fontSize:"0.82rem", color:"#166534", fontWeight:"600", flex:1 }}>{h.submissionName}</span>
                    <a href={h.submissionUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:"0.75rem", color:"#15803d", fontWeight:"700", textDecoration:"none" }}>View</a>
                  </div>
                )}

                {/* Teacher feedback */}
                {h.feedback && (
                  <div style={{ marginTop:"0.75rem", padding:"0.625rem", background:"#f0fdf4", borderRadius:"0.375rem", fontSize:"0.85rem", color:"#065f46" }}>
                    💬 <strong>Teacher feedback:</strong> {h.feedback}
                  </div>
                )}

                {/* Submit button / upload section */}
                {canSubmit(h) && (
                  <div style={{ marginTop:"0.875rem" }}>
                    {!isExpanded ? (
                      <button
                        onClick={() => setExpandedId(h.id)}
                        style={{ padding:"0.5rem 1.25rem", background:"var(--primary-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))", color:"white", border:"none", borderRadius:"0.5rem", fontWeight:"600", fontSize:"0.82rem", cursor:"pointer" }}
                      >
                        📤 Submit Homework
                      </button>
                    ) : (
                      <div style={{ border:"1.5px solid #e0e7ff", borderRadius:"0.75rem", padding:"1rem", background:"#fafafe" }}>
                        <div style={{ fontWeight:"600", color:"#4f46e5", marginBottom:"0.75rem", fontSize:"0.875rem" }}>📤 Upload your submission</div>
                        <FileUpload
                          bucket="submission"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.zip"
                          label="Attach your completed homework"
                          onUploaded={r => setUploadData(prev => ({ ...prev, [h.id]: r }))}
                        />
                        <div style={{ display:"flex", gap:"0.625rem", marginTop:"0.875rem" }}>
                          <button
                            onClick={() => handleSubmit(h)}
                            disabled={submitting === h.id}
                            style={{ flex:1, padding:"0.625rem", background:"linear-gradient(135deg,#10b981,#059669)", color:"white", border:"none", borderRadius:"0.5rem", fontWeight:"700", fontSize:"0.82rem", cursor: submitting === h.id ? "not-allowed" : "pointer" }}
                          >
                            {submitting === h.id ? "Submitting..." : uploadData[h.id] ? "✅ Submit with file" : "Submit (no file)"}
                          </button>
                          <button
                            onClick={() => setExpandedId(null)}
                            style={{ padding:"0.625rem 1rem", background:"#f1f5f9", color:"#475569", border:"none", borderRadius:"0.5rem", fontWeight:"600", fontSize:"0.82rem", cursor:"pointer" }}
                          >
                            Cancel
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
      )}
    </div>
  );
}

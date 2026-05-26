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

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  ASSIGNED:  { label: "Assigned",  bg: "#fef3c7", color: "#b45309", dot: "#f59e0b" },
  SUBMITTED: { label: "Submitted", bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  GRADED:    { label: "Graded",    bg: "#dcfce7", color: "#16a34a", dot: "#10b981" },
  LATE:      { label: "Late",      bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
};

export default function StudentHomeworkPage() {
  const [homework, setHomework] = useState<HWGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<Record<string, { url: string; name: string; size: number }>>({});

  useEffect(() => {
    fetch("/api/student/homework").then(r => r.json()).then(setHomework).finally(() => setLoading(false));
  }, []);

  const pending   = homework.filter(h => h.status === "ASSIGNED" || h.status === "LATE");
  const submitted = homework.filter(h => h.status === "SUBMITTED");
  const graded    = homework.filter(h => h.status === "GRADED");
  const avgScore  = graded.length > 0 ? graded.reduce((s, h) => s + (h.score || 0), 0) / graded.length : 0;

  async function handleSubmit(grade: HWGrade) {
    setSubmitting(grade.id);
    const file = uploadData[grade.id];
    const res = await fetch("/api/student/homework", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeworkGradeId: grade.id, submissionUrl: file?.url || null, submissionName: file?.name || null, submissionSize: file?.size || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setHomework(prev => prev.map(h => h.id === grade.id ? { ...h, ...updated } : h));
      setExpandedId(null);
    }
    setSubmitting(null);
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>My Homework</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>Track assignments and submit your work</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total",     value: homework.length,  color: "var(--primary)", borderColor: "var(--primary)" },
          { label: "Pending",   value: pending.length,   color: pending.length > 0 ? "#f59e0b" : "#10b981", borderColor: pending.length > 0 ? "#f59e0b" : "#10b981" },
          { label: "Submitted", value: submitted.length, color: "#3b82f6", borderColor: "#3b82f6" },
          { label: "Avg Score", value: graded.length > 0 ? `${avgScore.toFixed(0)}%` : "—", color: "#10b981", borderColor: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", border: "1px solid #e2e8f0", borderTop: `3px solid ${s.borderColor}`, borderRadius: "0.875rem", padding: "1.125rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginTop: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading...</div>
      ) : homework.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>📋</div>
          <div style={{ fontWeight: "600", color: "#0f172a" }}>No homework assigned yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {homework.map(h => {
            const st = STATUS_STYLE[h.status] || STATUS_STYLE.ASSIGNED;
            const isOverdue = new Date(h.homework.dueDate) < new Date() && h.status === "ASSIGNED";
            const pct = h.score != null ? Math.round((h.score / h.homework.maxScore) * 100) : null;
            const isExpanded = expandedId === h.id;

            return (
              <div key={h.id} style={{
                background: "white", border: "1px solid #e2e8f0",
                borderLeft: `4px solid ${isOverdue ? "#ef4444" : st.dot}`,
                borderRadius: "0.875rem", padding: "1.25rem 1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.625rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.9375rem", color: "#0f172a" }}>{h.homework.title}</span>
                      <span style={{ padding: "0.1rem 0.5rem", borderRadius: "9999px", background: "var(--primary-light, #ede9fe)", color: "#5b21b6", fontSize: "0.68rem", fontWeight: "600" }}>{h.homework.group.name}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      👩‍🏫 {h.homework.teacher.user.firstName} {h.homework.teacher.user.lastName}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "1rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.625rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "700", background: isOverdue ? "#fee2e2" : st.bg, color: isOverdue ? "#dc2626" : st.color }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isOverdue ? "#dc2626" : st.dot }} />
                      {isOverdue ? "Overdue" : st.label}
                    </span>
                    {pct !== null && (
                      <div style={{ marginTop: "0.375rem", fontWeight: "800", fontSize: "1rem", color: pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444" }}>
                        {h.score}/{h.homework.maxScore} ({pct}%)
                      </div>
                    )}
                  </div>
                </div>

                {h.homework.description && (
                  <p style={{ color: "#475569", fontSize: "0.825rem", margin: "0.5rem 0" }}>{h.homework.description}</p>
                )}

                <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <span>📅 Due: {new Date(h.homework.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  {h.homework.returnDate && <span>↩️ Return: {new Date(h.homework.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                  <span>Max: {h.homework.maxScore} pts</span>
                </div>

                {/* Teacher's file */}
                {h.homework.fileUrl && h.homework.fileName && (
                  <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", background: "#f0f9ff", borderRadius: "0.5rem", border: "1px solid #bae6fd" }}>
                    <span>📎</span>
                    <span style={{ fontSize: "0.8rem", color: "#0369a1", fontWeight: "600", flex: 1 }}>{h.homework.fileName}</span>
                    <a href={h.homework.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: "700", textDecoration: "none" }}>Download</a>
                  </div>
                )}

                {/* Submitted file */}
                {h.submissionUrl && h.submissionName && (
                  <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", background: "#f0fdf4", borderRadius: "0.5rem", border: "1px solid #86efac" }}>
                    <span>📤</span>
                    <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: "600", flex: 1 }}>{h.submissionName}</span>
                    <a href={h.submissionUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: "700", textDecoration: "none" }}>View</a>
                  </div>
                )}

                {/* Teacher feedback */}
                {h.feedback && (
                  <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#f0fdf4", borderRadius: "0.5rem", fontSize: "0.8rem", color: "#065f46", border: "1px solid #bbf7d0" }}>
                    💬 <strong>Teacher feedback:</strong> {h.feedback}
                  </div>
                )}

                {/* Submit */}
                {(h.status === "ASSIGNED" || h.status === "LATE") && (
                  <div style={{ marginTop: "1rem" }}>
                    {!isExpanded ? (
                      <button onClick={() => setExpandedId(h.id)} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
                        📤 Submit Homework
                      </button>
                    ) : (
                      <div style={{ border: "1.5px solid #e0e7ff", borderRadius: "0.75rem", padding: "1rem", background: "#fafafe" }}>
                        <div style={{ fontWeight: "600", color: "#4f46e5", marginBottom: "0.75rem", fontSize: "0.875rem" }}>📤 Upload your submission</div>
                        <FileUpload bucket="submission" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.zip" label="Attach your completed homework" onUploaded={r => setUploadData(prev => ({ ...prev, [h.id]: r }))} />
                        <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.875rem" }}>
                          <button onClick={() => handleSubmit(h)} disabled={submitting === h.id} className="btn btn-primary" style={{ flex: 1, justifyContent: "center", background: "linear-gradient(135deg,#10b981,#059669)", fontSize: "0.82rem" }}>
                            {submitting === h.id ? "Submitting..." : uploadData[h.id] ? "✅ Submit with file" : "Submit (no file)"}
                          </button>
                          <button onClick={() => setExpandedId(null)} className="btn btn-secondary" style={{ fontSize: "0.82rem" }}>Cancel</button>
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

"use client";

import { useEffect, useState } from "react";

type ExamResult = { studentId: string; student: { user: { firstName: string; lastName: string } }; score?: number | null; feedback?: string | null; };
type Exam = { id: string; title: string; description?: string | null; scheduledAt: string; duration?: number | null; maxScore: number; group: { id: string; name: string }; teacher: { user: { firstName: string; lastName: string } }; results: ExamResult[]; };
type Group = { id: string; name: string };
type Teacher = { id: string; user: { firstName: string; lastName: string } };

// ── Mini Calendar ──────────────────────────────────────────────
function CalendarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => value ? new Date(value) : new Date());

  const selected = value ? new Date(value) : null;
  const year = view.getFullYear();
  const month = view.getMonth();
  const monthName = view.toLocaleString("default", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function selectDay(day: number) {
    const d = new Date(year, month, day);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = value?.split("T")[1] || "09:00";
    onChange(`${dateStr}T${time}`);
    setOpen(false);
  }

  const displayDate = selected
    ? selected.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "Pick a date";

  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "0.625rem 0.875rem", border: "1.5px solid var(--border-strong, #c8c2b4)",
        borderRadius: "10px", background: "var(--surface, #faf8f3)", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem",
        color: selected ? "var(--text, #1a1a14)" : "#9a9485", fontFamily: "inherit", textAlign: "left",
        transition: "border-color 0.15s",
      }}>
        <i className="ti ti-calendar" style={{ color: "var(--primary, #2a5c45)", fontSize: "1rem" }} />
        {displayDate}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "var(--surface, #faf8f3)", border: "1px solid var(--border-soft, #e8e3d8)",
          borderRadius: "14px", padding: "1rem", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          minWidth: "280px",
        }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <button type="button" onClick={() => setView(new Date(year, month - 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-2, #5a5548)", padding: "0.2rem 0.4rem", borderRadius: "6px" }}>‹</button>
            <span style={{ fontWeight: "700", fontSize: "0.875rem", color: "var(--text, #1a1a14)" }}>{monthName}</span>
            <button type="button" onClick={() => setView(new Date(year, month + 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-2, #5a5548)", padding: "0.2rem 0.4rem", borderRadius: "6px" }}>›</button>
          </div>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", marginBottom: "4px" }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", fontWeight: "700", color: "var(--text-3, #9a9485)", padding: "4px 0" }}>{d}</div>
            ))}
          </div>
          {/* Days */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isSelected = selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
              const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === day;
              return (
                <button type="button" key={i} onClick={() => selectDay(day)} style={{
                  padding: "6px 2px", border: "none", borderRadius: "8px", cursor: "pointer",
                  fontSize: "0.8rem", fontWeight: isSelected ? "700" : "400",
                  background: isSelected ? "var(--primary, #2a5c45)" : isToday ? "var(--primary-light, #d4ede1)" : "transparent",
                  color: isSelected ? "white" : isToday ? "var(--primary, #2a5c45)" : "var(--text, #1a1a14)",
                  transition: "background 0.1s",
                }}>
                  {day}
                </button>
              );
            })}
          </div>
          {/* Time input */}
          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-soft, #e8e3d8)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="ti ti-clock" style={{ color: "var(--text-3, #9a9485)", fontSize: "0.9rem" }} />
            <input type="time" value={value?.split("T")[1] || "09:00"}
              onChange={e => {
                const date = value?.split("T")[0] || new Date().toISOString().split("T")[0];
                onChange(`${date}T${e.target.value}`);
              }}
              style={{ border: "1.5px solid var(--border, #ddd8cc)", borderRadius: "6px", padding: "0.3rem 0.5rem", fontSize: "0.835rem", fontFamily: "inherit", background: "var(--surface, #faf8f3)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ groupId: "", teacherId: "", title: "", description: "", scheduledAt: "", duration: "", maxScore: "100" });

  async function load() {
    setLoading(true);
    const [e, g, t] = await Promise.all([
      fetch("/api/admin/exams").then(r => r.json()),
      fetch("/api/admin/groups").then(r => r.json()),
      fetch("/api/admin/teachers").then(r => r.json()),
    ]);
    setExams(Array.isArray(e) ? e : []);
    setGroups(Array.isArray(g) ? g : g?.groups || []);
    setTeachers(Array.isArray(t) ? t : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditExam(null);
    setForm({ groupId: "", teacherId: "", title: "", description: "", scheduledAt: "", duration: "", maxScore: "100" });
    setError("");
    setShowModal(true);
  }

  function openEdit(exam: Exam) {
    setEditExam(exam);
    const dt = new Date(exam.scheduledAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    setForm({
      groupId: exam.group.id,
      teacherId: "",
      title: exam.title,
      description: exam.description || "",
      scheduledAt: local,
      duration: exam.duration?.toString() || "",
      maxScore: exam.maxScore.toString(),
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const url = editExam ? `/api/admin/exams/${editExam.id}` : "/api/teacher/exams";
    const method = editExam ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowModal(false); await load(); }
    else { const d = await res.json(); setError(d.error || "Failed to save"); }
    setSaving(false);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
    await load();
  }

  const upcoming = exams.filter(e => new Date(e.scheduledAt) >= new Date());
  const past = exams.filter(e => new Date(e.scheduledAt) < new Date());

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "var(--text, #1a1a14)", margin: "0 0 0.25rem" }}>Exams</h1>
          <p style={{ color: "var(--text-2, #5a5548)", margin: 0, fontSize: "0.875rem" }}>
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ gap: "0.375rem" }}>
          <i className="ti ti-plus" style={{ fontSize: "1rem" }} />
          Schedule Exam
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-3, #9a9485)" }}>Loading...</div>
      ) : exams.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
          <i className="ti ti-flask" style={{ fontSize: "3rem", color: "var(--text-3, #9a9485)", display: "block", marginBottom: "1rem" }} />
          <div style={{ fontWeight: "600", color: "var(--text, #1a1a14)", marginBottom: "0.375rem" }}>No exams scheduled yet</div>
          <div style={{ color: "var(--text-2, #5a5548)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>Create the first exam for any group</div>
          <button onClick={openCreate} className="btn btn-primary">+ Schedule Exam</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3, #9a9485)", marginBottom: "0.75rem" }}>
                Upcoming ({upcoming.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {upcoming.map(exam => <ExamCard key={exam.id} exam={exam} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3, #9a9485)", marginBottom: "0.75rem" }}>
                Past ({past.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {past.map(exam => <ExamCard key={exam.id} exam={exam} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,20,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--surface, #faf8f3)", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text, #1a1a14)", margin: 0 }}>
                {editExam ? "Edit Exam" : "Schedule New Exam"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "var(--surface-2, #ede9de)", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Group */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Group *</label>
                <select className="input" required value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>
                  <option value="">Select group...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              {/* Teacher (only on create) */}
              {!editExam && (
                <div style={{ marginBottom: "1rem" }}>
                  <label className="label">Teacher *</label>
                  <select className="input" required value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
                    <option value="">Select teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.user.firstName} {t.user.lastName}</option>)}
                  </select>
                </div>
              )}

              {/* Title */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Exam Title *</label>
                <input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-term Exam Unit 4" />
              </div>

              {/* Description */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Description / Notes</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Topics covered, what to bring..." style={{ resize: "vertical" }} />
              </div>

              {/* Date picker */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label className="label">Date & Time *</label>
                  <CalendarPicker value={form.scheduledAt} onChange={v => setForm({ ...form, scheduledAt: v })} />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input className="input" type="number" min="10" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="60" />
                </div>
                <div>
                  <label className="label">Max Score</label>
                  <input className="input" type="number" min="1" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} />
                </div>
              </div>

              {error && (
                <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                  {saving ? "Saving..." : editExam ? "Save Changes" : "Schedule Exam"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Exam Card ──────────────────────────────────────────────────
function ExamCard({ exam, onEdit, onDelete }: { exam: Exam; onEdit: (e: Exam) => void; onDelete: (id: string, title: string) => void }) {
  const graded = exam.results.filter(r => r.score != null).length;
  const total = exam.results.length;
  const avg = graded > 0 ? (exam.results.filter(r => r.score != null).reduce((s, r) => s + (r.score || 0), 0) / graded).toFixed(1) : null;
  const isPast = new Date(exam.scheduledAt) < new Date();
  const dt = new Date(exam.scheduledAt);

  return (
    <div style={{ background: "var(--surface, #faf8f3)", border: "1px solid var(--border-soft, #e8e3d8)", borderRadius: "14px", padding: "1.125rem 1.375rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 3px rgba(26,26,20,0.05)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: "700", fontSize: "0.9375rem", color: "var(--text, #1a1a14)" }}>{exam.title}</span>
          <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", background: "var(--primary-light, #d4ede1)", color: "var(--primary, #2a5c45)", fontSize: "0.7rem", fontWeight: "600" }}>{exam.group.name}</span>
          <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600", background: isPast ? "#dcfce7" : "#fef3c7", color: isPast ? "#16a34a" : "#b45309" }}>
            {isPast ? "Past" : "Upcoming"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "1.125rem", fontSize: "0.78rem", color: "var(--text-2, #5a5548)", flexWrap: "wrap" }}>
          <span><i className="ti ti-calendar" style={{ marginRight: "3px" }} />{dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span><i className="ti ti-user" style={{ marginRight: "3px" }} />{exam.teacher.user.firstName} {exam.teacher.user.lastName}</span>
          {exam.duration && <span><i className="ti ti-clock" style={{ marginRight: "3px" }} />{exam.duration} min</span>}
          <span>Max: {exam.maxScore} pts</span>
          <span style={{ color: graded === total && total > 0 ? "#10b981" : "var(--text-2, #5a5548)" }}>
            ✓ {graded}/{total} graded
          </span>
          {avg && <span>⭐ Avg: {avg}</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button onClick={() => onEdit(exam)} style={{ padding: "0.4rem 0.875rem", background: "var(--surface-2, #ede9de)", color: "var(--text, #1a1a14)", border: "1px solid var(--border, #ddd8cc)", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <i className="ti ti-edit" /> Edit
        </button>
        <button onClick={() => onDelete(exam.id, exam.title)} style={{ padding: "0.4rem 0.875rem", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <i className="ti ti-trash" /> Delete
        </button>
      </div>
    </div>
  );
}

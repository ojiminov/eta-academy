"use client";

import { useEffect, useState } from "react";

type AttendanceRecord = { id: string; status: string; student: { id: string; user: { firstName: string; lastName: string } } };
type Teacher = { user: { firstName: string; lastName: string } };
type Group = { id: string; name: string };
type ClassSessionData = { id: string; scheduledAt: string; group: Group; teacher: Teacher; attendances: AttendanceRecord[] };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT:     { label: "Present",     color: "#065f46", bg: "#d1fae5" },
  ABSENT:      { label: "Absent",      color: "#991b1b", bg: "#fee2e2" },
  LATE:        { label: "Late",        color: "#92400e", bg: "#fef3c7" },
  EXCUSED:     { label: "Excused",     color: "#1e40af", bg: "#dbeafe" },
  HOLIDAY:     { label: "Holiday",     color: "#4c1d95", bg: "#ede9fe" },
  HW_NOT_DONE: { label: "HW Not Done", color: "#7c2d12", bg: "#ffedd5" },
};

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<ClassSessionData[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/groups").then(r => r.json()).then((data) => {
      setGroups(Array.isArray(data) ? data : data.groups || []);
    });
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (groupId) params.set("groupId", groupId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/admin/attendance?${params}`)
      .then(r => r.json())
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }

  // Aggregate stats
  const totalRecords = sessions.flatMap(s => s.attendances).length;
  const presentCount = sessions.flatMap(s => s.attendances).filter(a => a.status === "PRESENT").length;
  const absentCount = sessions.flatMap(s => s.attendances).filter(a => a.status === "ABSENT").length;
  const lateCount = sessions.flatMap(s => s.attendances).filter(a => a.status === "LATE").length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>✅ Attendance Report</h1>
        <p style={{ color: "#64748b", margin: 0 }}>View and filter attendance across all groups</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", marginBottom: "0.25rem" }}>Group</label>
          <select value={groupId} onChange={e => setGroupId(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", background: "white" }}>
            <option value="">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", marginBottom: "0.25rem" }}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem" }} />
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", marginBottom: "0.25rem" }}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem" }} />
        </div>
        <button onClick={loadData} disabled={loading}
          style={{ padding: "0.5rem 1.25rem", background: "var(--primary, #6366f1)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600", height: "38px" }}>
          {loading ? "Loading…" : "🔍 Apply Filter"}
        </button>
        <button onClick={() => { setGroupId(""); setFrom(""); setTo(""); setTimeout(loadData, 0); }}
          style={{ padding: "0.5rem 1rem", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600", height: "38px" }}>
          Clear
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Attendance Rate", value: `${attendanceRate}%`, color: attendanceRate >= 80 ? "#10b981" : attendanceRate >= 60 ? "#f59e0b" : "#ef4444", bg: attendanceRate >= 80 ? "#d1fae5" : attendanceRate >= 60 ? "#fef3c7" : "#fee2e2", icon: "📊" },
          { label: "Present",  value: presentCount, color: "#065f46", bg: "#d1fae5", icon: "✅" },
          { label: "Absent",   value: absentCount,  color: "#991b1b", bg: "#fee2e2", icon: "❌" },
          { label: "Late",     value: lateCount,    color: "#92400e", bg: "#fef3c7", icon: "⏰" },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "1.125rem", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📋</div>
          <div style={{ fontWeight: "600", color: "#1e293b" }}>No sessions found</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Try adjusting your filters</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sessions.map(s => {
            const present = s.attendances.filter(a => a.status === "PRESENT").length;
            const total = s.attendances.length;
            const rate = total > 0 ? Math.round((present / total) * 100) : 0;
            const isOpen = expanded === s.id;

            // Status counts
            const counts: Record<string, number> = {};
            s.attendances.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

            return (
              <div key={s.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <button onClick={() => setExpanded(isOpen ? null : s.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "0.125rem" }}>
                      {s.group.name} · {new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {s.teacher.user.firstName} {s.teacher.user.lastName} · {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {/* Status pills */}
                  <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {Object.entries(counts).map(([st, count]) => {
                      const cfg = STATUS_CONFIG[st] || { label: st, color: "#475569", bg: "#f1f5f9" };
                      return (
                        <span key={st} style={{ padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600", background: cfg.bg, color: cfg.color }}>
                          {cfg.label}: {count}
                        </span>
                      );
                    })}
                  </div>
                  {/* Rate */}
                  <div style={{ fontWeight: "700", color: rate >= 80 ? "#10b981" : rate >= 60 ? "#f59e0b" : "#ef4444", minWidth: "48px", textAlign: "right" }}>
                    {total > 0 ? `${rate}%` : "—"}
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && s.attendances.length > 0 && (
                  <div style={{ borderTop: "1px solid #f1f5f9" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "0.5rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Student</th>
                          <th style={{ padding: "0.5rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.attendances.map((a, i) => {
                          const cfg = STATUS_CONFIG[a.status] || { label: a.status, color: "#475569", bg: "#f1f5f9" };
                          return (
                            <tr key={a.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem", color: "#1e293b" }}>
                                {a.student.user.firstName} {a.student.user.lastName}
                              </td>
                              <td style={{ padding: "0.625rem 1.25rem" }}>
                                <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600", background: cfg.bg, color: cfg.color }}>
                                  {cfg.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {isOpen && s.attendances.length === 0 && (
                  <div style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontSize: "0.875rem", borderTop: "1px solid #f1f5f9" }}>No attendance records for this session.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

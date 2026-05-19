"use client";

import { useEffect, useState } from "react";

type Group = { id: string; name: string; schedule: string; room?: string; level: string; monthlyFee: number; teacher: { user: { firstName: string; lastName: string } }; };

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  BEGINNER:          { bg: "#f1f5f9", color: "#475569" },
  ELEMENTARY:        { bg: "#dbeafe", color: "#1e40af" },
  PRE_INTERMEDIATE:  { bg: "#dbeafe", color: "#1e40af" },
  INTERMEDIATE:      { bg: "#fef9c3", color: "#854d0e" },
  UPPER_INTERMEDIATE:{ bg: "#fef3c7", color: "#b45309" },
  ADVANCED:          { bg: "#dcfce7", color: "#166534" },
};

const LEVEL_BAR: Record<string, string> = {
  BEGINNER: "#94a3b8", ELEMENTARY: "#3b82f6", PRE_INTERMEDIATE: "#06b6d4",
  INTERMEDIATE: "#10b981", UPPER_INTERMEDIATE: "#f59e0b", ADVANCED: "#ef4444",
};

export default function TimetablePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/timetable").then(r => r.json()).then(setGroups).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>Class Timetable</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>Your weekly class schedule</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading...</div>
      ) : groups.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>🗓️</div>
          <div style={{ fontWeight: "600", color: "#0f172a" }}>No classes scheduled yet</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>The admin will assign you to a group</div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.125rem", marginBottom: "1.5rem" }}>
            {groups.map(g => {
              const levelStyle = LEVEL_STYLE[g.level] || { bg: "#dbeafe", color: "#1e40af" };
              const barColor = LEVEL_BAR[g.level] || "#6366f1";
              return (
                <div key={g.id} style={{
                  background: "white", border: "1px solid #e2e8f0",
                  borderRadius: "0.875rem", overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ height: "4px", background: barColor }} />
                  <div style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "1rem", color: "#0f172a", marginBottom: "0.375rem" }}>{g.name}</div>
                        <span style={{ display: "inline-flex", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600", background: levelStyle.bg, color: levelStyle.color }}>
                          {g.level.replace(/_/g, " ")}
                        </span>
                      </div>
                      {g.room && (
                        <span style={{ padding: "0.25rem 0.625rem", borderRadius: "0.375rem", background: "#f1f5f9", color: "#475569", fontSize: "0.72rem", fontWeight: "600" }}>
                          🚪 {g.room}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {[
                        { icon: "📅", text: g.schedule, bold: true },
                        { icon: "👨‍🏫", text: `${g.teacher.user.firstName} ${g.teacher.user.lastName}` },
                        { icon: "💰", text: `${g.monthlyFee.toLocaleString()} UZS/month` },
                      ].map((row, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#475569" }}>
                          <span style={{ fontSize: "0.875rem", width: "18px", textAlign: "center" }}>{row.icon}</span>
                          <span style={{ fontWeight: row.bold ? "600" : "400", color: row.bold ? "#0f172a" : "#475569" }}>{row.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "0.875rem", padding: "1rem 1.25rem", fontSize: "0.8rem", color: "#0369a1" }}>
            💡 Your schedule shows the days and times for each group. Contact the academy if you need to change your schedule.
          </div>
        </>
      )}
    </div>
  );
}

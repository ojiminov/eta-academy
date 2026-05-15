"use client";

import { useEffect, useState } from "react";

type Group = { id: string; name: string; schedule: string; room?: string; level: string; monthlyFee: number; teacher: { user: { firstName: string; lastName: string } }; };

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER:"#6366f1", ELEMENTARY:"#8b5cf6", PRE_INTERMEDIATE:"#06b6d4",
  INTERMEDIATE:"#10b981", UPPER_INTERMEDIATE:"#f59e0b", ADVANCED:"#ef4444"
};

export default function TimetablePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/timetable").then(r => r.json()).then(setGroups).finally(() => setLoading(false));
  }, []);

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>🗓️ Class Timetable</h1>
        <p style={{ color:"#64748b", margin:0 }}>Your weekly class schedule</p>
      </div>

      {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>Loading...</div>
        : groups.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>🗓️</div>
          <div style={{ fontWeight:"600", color:"#1e293b" }}>No classes scheduled yet</div>
          <div style={{ color:"#64748b", fontSize:"0.875rem", marginTop:"0.5rem" }}>The admin will assign you to a group</div>
        </div>
      ) : (
        <>
          {/* Cards view */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:"1.25rem", marginBottom:"2rem" }}>
            {groups.map(g => {
              const color = LEVEL_COLORS[g.level] || "#6366f1";
              return (
                <div key={g.id} className="card" style={{ borderTop:`4px solid ${color}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem" }}>
                    <div>
                      <div style={{ fontWeight:"700", fontSize:"1rem", color:"#1e293b" }}>{g.name}</div>
                      <div style={{ fontSize:"0.75rem", color:color, fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.05em" }}>{g.level.replace(/_/g," ")}</div>
                    </div>
                    {g.room && (
                      <span style={{ padding:"0.25rem 0.625rem", borderRadius:"0.375rem", background:"#f1f5f9", color:"#475569", fontSize:"0.75rem", fontWeight:"600" }}>
                        🚪 Room {g.room}
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.875rem", color:"#475569" }}>
                      <span>📅</span>
                      <span style={{ fontWeight:"500" }}>{g.schedule}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.875rem", color:"#475569" }}>
                      <span>👨‍🏫</span>
                      <span>{g.teacher.user.firstName} {g.teacher.user.lastName}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.875rem", color:"#475569" }}>
                      <span>💳</span>
                      <span>{g.monthlyFee.toLocaleString()} UZS/month</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Schedule string breakdown hint */}
          <div className="card" style={{ background:"#f0f9ff" }}>
            <p style={{ color:"#0369a1", fontSize:"0.875rem", margin:0 }}>
              💡 Your schedule shows the days and times for each group. Contact the academy if you need to change your schedule.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

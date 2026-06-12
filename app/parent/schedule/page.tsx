"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Group = { id: string; name: string; schedule: string; room?: string; level: string; monthlyFee: number; teacher: { user: { firstName: string; lastName: string } }; };

const LEVEL_COLORS: Record<string, string> = { BEGINNER:"var(--primary, #6366f1)",ELEMENTARY:"#8b5cf6",PRE_INTERMEDIATE:"#06b6d4",INTERMEDIATE:"#10b981",UPPER_INTERMEDIATE:"#f59e0b",ADVANCED:"#ef4444" };

export default function ParentSchedulePage() {
  const t = useTranslations();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/timetable").then(r=>r.json()).then(setGroups).finally(()=>setLoading(false));
  }, []);

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>🗓️ {t("parent.classSchedule")}</h1>
        <p style={{ color:"#64748b", margin:0 }}>{t("parent.childScheduleDesc")}</p>
      </div>

      {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>{t("common.loading")}</div>
        : groups.length===0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>🗓️</div>
          <div style={{ fontWeight:"600", color:"#1e293b" }}>{t("parent.noClassesScheduled")}</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:"1.25rem" }}>
          {groups.map(g => {
            const color = LEVEL_COLORS[g.level]||"var(--primary, #6366f1)";
            return (
              <div key={g.id} className="card" style={{ borderTop:`4px solid ${color}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem" }}>
                  <div>
                    <div style={{ fontWeight:"700", fontSize:"1rem", color:"#1e293b" }}>{g.name}</div>
                    <div style={{ fontSize:"0.75rem", color:color, fontWeight:"600", textTransform:"uppercase" }}>{g.level.replace(/_/g," ")}</div>
                  </div>
                  {g.room && <span style={{ padding:"0.25rem 0.625rem", borderRadius:"0.375rem", background:"#f1f5f9", color:"#475569", fontSize:"0.75rem", fontWeight:"600" }}>🚪 Room {g.room}</span>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.875rem", color:"#475569" }}>
                    <span>📅</span><span style={{ fontWeight:"500" }}>{g.schedule}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.875rem", color:"#475569" }}>
                    <span>👨‍🏫</span><span>{g.teacher.user.firstName} {g.teacher.user.lastName}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.875rem", color:"#475569" }}>
                    <span>💳</span><span>{g.monthlyFee.toLocaleString()} UZS/month</span>
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

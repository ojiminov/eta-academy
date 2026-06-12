"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type AttendanceRecord = {
  id: string; status: string; createdAt: string;
  classSession: { scheduledAt: string; topic?: string; group: { name: string } };
};

export default function ParentAttendancePage() {
  const t = useTranslations();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/child").then(r=>r.json()).then(d => {
      if (d.attendances) setRecords(d.attendances);
    }).finally(()=>setLoading(false));
  }, []);

  const present = records.filter(r => r.status === "PRESENT").length;
  const rate = records.length > 0 ? Math.round((present/records.length)*100) : 0;

  const STATUS_INFO: Record<string, { label:string; bg:string; color:string; icon:string }> = {
    PRESENT:    { label: t("attendance.present"),   bg:"#d1fae5", color:"#065f46", icon:"✅" },
    ABSENT:     { label: t("attendance.absent"),    bg:"#fee2e2", color:"#991b1b", icon:"❌" },
    LATE:       { label: t("attendance.late"),      bg:"#fef3c7", color:"#92400e", icon:"⏰" },
    EXCUSED:    { label: t("attendance.excused"),   bg:"#dbeafe", color:"#1e40af", icon:"📋" },
    HOLIDAY:    { label: t("attendance.holiday"),   bg:"var(--primary-light, #ede9fe)", color:"#5b21b6", icon:"🎉" },
    HW_NOT_DONE:{ label: t("attendance.hwNotDone"), bg:"#fef9c3", color:"#854d0e", icon:"📚" },
  };

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>✅ {t("parent.childAttendanceTitle")}</h1>
        <p style={{ color:"#64748b", margin:0 }}>{t("parent.attendanceHistoryDesc")}</p>
      </div>

      <div style={{ background: rate>=80?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#ef4444,#dc2626)", borderRadius:"1rem", padding:"1.25rem 1.5rem", marginBottom:"1.5rem", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:"0.8rem", opacity:0.85 }}>{t("parent.attendanceRate")}</div>
          <div style={{ fontSize:"2.5rem", fontWeight:"800" }}>{rate}%</div>
          <div style={{ fontSize:"0.875rem", opacity:0.9 }}>{t("parent.presentOutOf", { n: present, total: records.length })}</div>
        </div>
        <div style={{ fontSize:"4rem" }}>{rate>=80?"🌟":"⚠️"}</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {["PRESENT","ABSENT","LATE","EXCUSED","HOLIDAY","HW_NOT_DONE"].map(s => {
          const info = STATUS_INFO[s];
          const cnt = records.filter(r=>r.status===s).length;
          return (
            <div key={s} className="card" style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <div style={{ width:40,height:40,borderRadius:8,background:info.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0 }}>{info.icon}</div>
              <div>
                <div style={{ fontSize:"1.25rem", fontWeight:"700", color:info.color }}>{cnt}</div>
                <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{info.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        {loading ? <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>{t("common.loading")}</div>
          : records.length===0 ? (
          <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:"0.5rem" }}>📋</div>
            <div>{t("parent.noAttendanceRecords")}</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {[t("common.date"), t("groups.title"), "Topic", t("common.status")].map(h=>(
                  <th key={h} style={{ padding:"0.75rem 1rem", textAlign:"left", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", textTransform:"uppercase", borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r,i) => {
                const info = STATUS_INFO[r.status] || STATUS_INFO.ABSENT;
                return (
                  <tr key={r.id} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"white":"#fafafa" }}>
                    <td style={{ padding:"0.875rem 1rem", fontSize:"0.875rem", color:"#475569" }}>{new Date(r.classSession.scheduledAt).toLocaleDateString()}</td>
                    <td style={{ padding:"0.875rem 1rem", fontWeight:"500", color:"#1e293b" }}>{r.classSession.group.name}</td>
                    <td style={{ padding:"0.875rem 1rem", fontSize:"0.875rem", color:"#64748b" }}>{r.classSession.topic || "—"}</td>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      <span style={{ padding:"0.25rem 0.625rem", borderRadius:"9999px", fontSize:"0.75rem", fontWeight:"700", background:info.bg, color:info.color }}>
                        {info.icon} {info.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ChildData = {
  parent: {
    student: {
      user: { firstName: string; lastName: string; email: string };
      englishLevel: string;
      balance: number;
      status: string;
      groupStudents: { group: { name: string; schedule: string; teacher: { user: { firstName: string; lastName: string } } } }[];
      payments: { amount: number; status: string; createdAt: string }[];
      grades: { score: number; maxScore: number; label?: string; createdAt: string }[];
      homeworkGrades: { status: string; score?: number; homework: { title: string; dueDate: string } }[];
      examResults: { score?: number; exam: { title: string; maxScore: number; scheduledAt: string } }[];
    };
  };
  attendances: { status: string; classSession: { scheduledAt: string; group: { name: string } } }[];
};

const LEVEL_LABELS: Record<string, string> = { BEGINNER:"Beginner",ELEMENTARY:"Elementary",PRE_INTERMEDIATE:"Pre-Intermediate",INTERMEDIATE:"Intermediate",UPPER_INTERMEDIATE:"Upper-Intermediate",ADVANCED:"Advanced" };

export default function ParentDashboard() {
  const [data, setData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/child").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>Loading...</div>;
  if (!data || !data.parent) return <div style={{ padding:"3rem", textAlign:"center", color:"#ef4444" }}>Parent profile not found. Contact admin.</div>;

  const child = data.parent.student;
  const name = `${child.user.firstName} ${child.user.lastName}`;
  const attPresent = data.attendances.filter(a => a.status === "PRESENT").length;
  const attTotal = data.attendances.length;
  const attRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;
  const grades = child.grades;
  const avgGrade = grades.length > 0 ? Math.round(grades.reduce((s,g) => s+(g.score/g.maxScore)*100,0)/grades.length) : null;
  const pendingPayments = child.payments.filter(p => p.status === "PENDING" || p.status === "OVERDUE").length;
  const pendingHomework = child.homeworkGrades.filter(h => h.status === "ASSIGNED" || h.status === "LATE").length;

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>👨‍👩‍👧 Parent Dashboard</h1>
        <p style={{ color:"#64748b", margin:0 }}>Monitoring {name}&apos;s progress</p>
      </div>

      {/* Child info card */}
      <div style={{ background:"linear-gradient(135deg,#ec4899,#be185d)", borderRadius:"1rem", padding:"1.5rem", marginBottom:"1.5rem", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:"0.8rem", opacity:0.85 }}>Your Child</div>
          <div style={{ fontSize:"1.5rem", fontWeight:"800" }}>{name}</div>
          <div style={{ fontSize:"0.875rem", opacity:0.9 }}>{LEVEL_LABELS[child.englishLevel]} • {child.groupStudents.length} active group{child.groupStudents.length!==1?"s":""}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"0.8rem", opacity:0.85 }}>Account Balance</div>
          <div style={{ fontSize:"1.5rem", fontWeight:"800" }}>{child.balance.toLocaleString()} UZS</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {[
          { label:"Attendance Rate", value:`${attRate}%`, icon:"✅", color: attRate>=80?"#10b981":"#ef4444", bg: attRate>=80?"#d1fae5":"#fee2e2" },
          { label:"Average Grade", value: avgGrade!==null?`${avgGrade}%`:"—", icon:"📝", color:"#6366f1", bg:"#ede9fe" },
          { label:"Pending Homework", value:pendingHomework, icon:"📋", color:pendingHomework>0?"#f59e0b":"#10b981", bg:pendingHomework>0?"#fef3c7":"#d1fae5" },
          { label:"Unpaid Bills", value:pendingPayments, icon:"💳", color:pendingPayments>0?"#ef4444":"#10b981", bg:pendingPayments>0?"#fee2e2":"#d1fae5" },
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

      {/* Quick links */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"1.5rem" }}>
        {/* Groups */}
        <div className="card">
          <h3 style={{ fontSize:"0.9rem", fontWeight:"600", color:"#1e293b", marginBottom:"0.75rem" }}>📚 Classes</h3>
          {child.groupStudents.length === 0 ? (
            <p style={{ color:"#94a3b8", fontSize:"0.875rem" }}>No classes yet</p>
          ) : child.groupStudents.map((gs,i) => (
            <div key={i} style={{ padding:"0.625rem", background:"#f8fafc", borderRadius:"0.5rem", marginBottom:"0.5rem" }}>
              <div style={{ fontWeight:"600", fontSize:"0.875rem" }}>{gs.group.name}</div>
              <div style={{ fontSize:"0.75rem", color:"#64748b" }}>👨‍🏫 {gs.group.teacher.user.firstName} {gs.group.teacher.user.lastName}</div>
              <div style={{ fontSize:"0.75rem", color:"#64748b" }}>📅 {gs.group.schedule}</div>
            </div>
          ))}
        </div>

        {/* Recent homework */}
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
            <h3 style={{ fontSize:"0.9rem", fontWeight:"600", color:"#1e293b", margin:0 }}>📋 Recent Homework</h3>
            <Link href="/parent/grades" style={{ fontSize:"0.75rem", color:"#6366f1", fontWeight:"600", textDecoration:"none" }}>View all →</Link>
          </div>
          {child.homeworkGrades.slice(0,4).map((h,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0", borderBottom:"1px solid #f1f5f9" }}>
              <div>
                <div style={{ fontSize:"0.875rem", fontWeight:"500" }}>{h.homework.title}</div>
                <div style={{ fontSize:"0.7rem", color:"#94a3b8" }}>Due: {new Date(h.homework.dueDate).toLocaleDateString()}</div>
              </div>
              <span style={{ padding:"0.125rem 0.5rem", borderRadius:"9999px", fontSize:"0.7rem", fontWeight:"700", background:h.status==="GRADED"?"#d1fae5":h.status==="LATE"?"#fee2e2":"#fef3c7", color:h.status==="GRADED"?"#065f46":h.status==="LATE"?"#dc2626":"#92400e" }}>
                {h.score!=null?`${h.score}pts`:h.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick navigation */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem" }}>
        {[
          { href:"/parent/attendance", icon:"✅", label:"Attendance", color:"#10b981" },
          { href:"/parent/grades",     icon:"📝", label:"Grades & Tests", color:"#6366f1" },
          { href:"/parent/payments",   icon:"💳", label:"Payments", color:"#f59e0b" },
          { href:"/parent/schedule",   icon:"🗓️", label:"Schedule", color:"#ec4899" },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.625rem", padding:"1.25rem", background:"white", borderRadius:"0.75rem", border:"1px solid #e2e8f0", textDecoration:"none", transition:"all 0.2s" }}>
            <span style={{ fontSize:"2rem" }}>{item.icon}</span>
            <span style={{ fontSize:"0.8rem", fontWeight:"600", color:item.color }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

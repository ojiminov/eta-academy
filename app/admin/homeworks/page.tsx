import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHomeworksPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const homeworks = await prisma.homework.findMany({
    include: {
      group: true,
      teacher: { include: { user: true } },
      grades: true,
    },
    orderBy: { dueDate: "desc" },
  });

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>📋 Homework — All Groups</h1>
        <p style={{ color:"#64748b", margin:0 }}>{homeworks.length} homework assignments across all groups</p>
      </div>

      {homeworks.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>📋</div>
          <div style={{ fontWeight:"600", color:"#1e293b" }}>No homework assigned yet</div>
          <div style={{ color:"#64748b", fontSize:"0.875rem" }}>Teachers can assign homework from their portal</div>
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Title","Group","Teacher","Due Date","Graded","Avg Score"].map(h=>(
                  <th key={h} style={{ padding:"0.75rem 1rem", textAlign:"left", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", textTransform:"uppercase", borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {homeworks.map((hw,i) => {
                const graded = hw.grades.filter(g=>g.status==="GRADED");
                const avg = graded.length > 0 ? (graded.reduce((s,g)=>s+(g.score||0),0)/graded.length).toFixed(1) : "—";
                const overdue = new Date(hw.dueDate) < new Date();
                return (
                  <tr key={hw.id} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"white":"#fafafa" }}>
                    <td style={{ padding:"0.875rem 1rem", fontWeight:"600", color:"#1e293b" }}>
                      {hw.title}
                      {overdue && <span style={{ marginLeft:"0.5rem", padding:"0.125rem 0.375rem", background:"#fee2e2", color:"#dc2626", borderRadius:"0.25rem", fontSize:"0.65rem", fontWeight:"700" }}>OVERDUE</span>}
                    </td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569" }}>{hw.group.name}</td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569" }}>{hw.teacher.user.firstName} {hw.teacher.user.lastName}</td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569", fontSize:"0.875rem" }}>{new Date(hw.dueDate).toLocaleDateString()}</td>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      <span style={{ fontWeight:"600" }}>{graded.length}</span>
                      <span style={{ color:"#94a3b8" }}>/{hw.grades.length}</span>
                    </td>
                    <td style={{ padding:"0.875rem 1rem", fontWeight:"700", color: avg!=="—"?Number(avg)>=70?"#10b981":"#f59e0b":"#94a3b8" }}>{avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

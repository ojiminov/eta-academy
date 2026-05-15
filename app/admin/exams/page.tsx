import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminExamsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const exams = await prisma.exam.findMany({
    include: {
      group: true,
      teacher: { include: { user: true } },
      results: true,
    },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>🧪 Exams — All Groups</h1>
        <p style={{ color:"#64748b", margin:0 }}>{exams.length} exams across all groups</p>
      </div>

      {exams.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>🧪</div>
          <div style={{ fontWeight:"600", color:"#1e293b" }}>No exams scheduled yet</div>
          <div style={{ color:"#64748b", fontSize:"0.875rem" }}>Teachers can schedule exams from their portal</div>
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Exam Title","Group","Teacher","Date","Duration","Graded","Avg Score"].map(h=>(
                  <th key={h} style={{ padding:"0.75rem 1rem", textAlign:"left", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", textTransform:"uppercase", borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exams.map((exam,i) => {
                const graded = exam.results.filter(r=>r.score!=null);
                const avg = graded.length > 0 ? (graded.reduce((s,r)=>s+(r.score||0),0)/graded.length).toFixed(1) : "—";
                const isPast = new Date(exam.scheduledAt) < new Date();
                return (
                  <tr key={exam.id} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"white":"#fafafa" }}>
                    <td style={{ padding:"0.875rem 1rem", fontWeight:"600", color:"#1e293b" }}>{exam.title}</td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569" }}>{exam.group.name}</td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569" }}>{exam.teacher.user.firstName} {exam.teacher.user.lastName}</td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569", fontSize:"0.875rem" }}>
                      {new Date(exam.scheduledAt).toLocaleDateString()}
                      <span style={{ marginLeft:"0.375rem", padding:"0.125rem 0.375rem", background:isPast?"#d1fae5":"#fef3c7", color:isPast?"#065f46":"#92400e", borderRadius:"0.25rem", fontSize:"0.65rem", fontWeight:"700" }}>
                        {isPast?"Past":"Upcoming"}
                      </span>
                    </td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569" }}>{exam.duration ? `${exam.duration}min` : "—"}</td>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      <span style={{ fontWeight:"600" }}>{graded.length}</span>
                      <span style={{ color:"#94a3b8" }}>/{exam.results.length}</span>
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

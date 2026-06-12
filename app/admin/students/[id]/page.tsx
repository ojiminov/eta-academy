import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import CreateParentAccountButton from "./CreateParentAccountButton";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      parents: { include: { parent: { include: { user: true } } } },
      groupStudents: {
        where: { isActive: true },
        include: { group: { include: { teacher: { include: { user: true } } } } },
      },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
      homeworkGrades: { where: { status: { in: ["ASSIGNED","LATE"] } } },
      examResults: { where: { score: { not: null } } },
    },
  });

  if (!student) notFound();

  const totalPaid = student.payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);
  const statusColors: Record<string, string> = { PAID:"badge-green", PENDING:"badge-yellow", OVERDUE:"badge-red", CANCELLED:"badge-gray" };
  const studentStatusColors: Record<string, { bg:string; color:string }> = {
    LEAD:     { bg:"#e0e7ff", color:"#3730a3" },
    TRIAL:    { bg:"#fef3c7", color:"#92400e" },
    ACTIVE:   { bg:"#d1fae5", color:"#065f46" },
    GRADUATE: { bg:"#dbeafe", color:"#1e40af" },
    INACTIVE: { bg:"#f1f5f9", color:"#475569" },
  };
  const sc = studentStatusColors[student.status] || studentStatusColors.ACTIVE;

  return (
    <div style={{ padding:"2rem", maxWidth:"960px" }}>
      <div style={{ marginBottom:"1.5rem" }}>
        <Link href="/admin/students" style={{ color:"var(--primary, #6366f1)", textDecoration:"none", fontSize:"0.875rem" }}>← Students</Link>
      </div>

      {/* Profile header */}
      <div className="card" style={{ display:"flex", alignItems:"center", gap:"1.5rem", marginBottom:"1.5rem" }}>
        <div style={{ width:72,height:72,borderRadius:"50%",background:"var(--primary-gradient, var(--primary-gradient, linear-gradient(135deg, #6366f1, #4f46e5)))",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:"700",fontSize:"1.5rem",flexShrink:0 }}>
          {student.user.firstName.charAt(0)}{student.user.lastName.charAt(0)}
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:"1.375rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>
            {student.user.firstName} {student.user.lastName}
          </h1>
          <div style={{ fontSize:"0.875rem", color:"#64748b", marginBottom:"0.25rem" }}>{student.user.email}</div>
          {student.user.phone && <div style={{ fontSize:"0.875rem", color:"#64748b" }}>📞 {student.user.phone}</div>}
          {student.parentName && <div style={{ fontSize:"0.875rem", color:"#64748b", marginTop:"0.25rem" }}>👨‍👩‍👦 Parent: {student.parentName}{student.parentPhone ? ` · ${student.parentPhone}` : ""}</div>}
          {student.enrollmentDate && <div style={{ fontSize:"0.8rem", color:"#94a3b8" }}>Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}</div>}
          {student.contractNumber && <div style={{ fontSize:"0.8rem", color:"#94a3b8" }}>Contract: {student.contractNumber}</div>}
        </div>
        <div style={{ textAlign:"right", display:"flex", flexDirection:"column", gap:"0.375rem", alignItems:"flex-end" }}>
          <span style={{ padding:"0.25rem 0.75rem", borderRadius:"9999px", fontSize:"0.75rem", fontWeight:"700", background:sc.bg, color:sc.color }}>{student.status}</span>
          <span className="badge badge-blue">{student.englishLevel.replace(/_/g," ")}</span>
          <span className={`badge ${student.user.isActive?"badge-green":"badge-gray"}`}>{student.user.isActive?"Active":"Inactive"}</span>
          {student.discountPercent > 0 && <span className="badge badge-yellow">{student.discountPercent}% discount</span>}
        </div>
      </div>

      {/* Finance overview */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {[
          { label:"Balance", value:`${student.balance.toLocaleString()} UZS`, color:student.balance>=0?"#10b981":"#ef4444", bg:student.balance>=0?"#d1fae5":"#fee2e2", icon:"💰" },
          { label:"Total Paid", value:`${totalPaid.toLocaleString()} UZS`, color:"var(--primary, #6366f1)", bg:"var(--primary-light, #ede9fe)", icon:"💳" },
          { label:"Pending HW", value:student.homeworkGrades.length, color:student.homeworkGrades.length>0?"#f59e0b":"#10b981", bg:student.homeworkGrades.length>0?"#fef3c7":"#d1fae5", icon:"📋" },
        ].map(s=>(
          <div key={s.label} className="card" style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <div style={{ width:44,height:44,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontWeight:"700", color:s.color }}>{s.value}</div>
              <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
        {/* Enrolled groups */}
        <div className="card">
          <h2 style={{ fontSize:"1rem", fontWeight:"600", color:"#1e293b", marginBottom:"1rem" }}>Enrolled Groups</h2>
          {student.groupStudents.length === 0 ? (
            <p style={{ color:"#64748b", fontSize:"0.875rem" }}>Not enrolled in any group.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {student.groupStudents.map((gs) => (
                <Link key={gs.id} href={`/admin/groups/${gs.group.id}`} style={{ textDecoration:"none" }}>
                  <div style={{ padding:"0.75rem 1rem", background:"#f8fafc", borderRadius:"0.5rem", border:"1px solid #e2e8f0", cursor:"pointer" }}>
                    <div style={{ fontWeight:"500", color:"#1e293b", fontSize:"0.875rem" }}>{gs.group.name}</div>
                    <div style={{ fontSize:"0.75rem", color:"#64748b", marginTop:"0.25rem" }}>
                      👨‍🏫 {gs.group.teacher.user.firstName} {gs.group.teacher.user.lastName} · {gs.group.schedule}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Payment history */}
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:"600", color:"#1e293b", margin:0 }}>Payments</h2>
            <span style={{ fontSize:"0.8rem", color:"#10b981", fontWeight:"600" }}>{totalPaid.toLocaleString()} UZS paid</span>
          </div>
          {student.payments.length === 0 ? (
            <p style={{ color:"#64748b", fontSize:"0.875rem" }}>No payments recorded.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
              {student.payments.map((p) => (
                <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:"0.875rem" }}>
                  <div>
                    <div style={{ fontWeight:"500" }}>{p.amount.toLocaleString()} UZS</div>
                    <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-GB") : new Date(p.createdAt).toLocaleDateString("en-GB")}</div>
                  </div>
                  <span className={`badge ${statusColors[p.status]||"badge-gray"}`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Parent Portal section */}
      <div className="card" style={{ marginTop:"1.5rem" }}>
        <h2 style={{ fontSize:"1rem", fontWeight:"600", color:"#1e293b", marginBottom:"1rem" }}>👨‍👩‍👧 Parent Portal</h2>
        {student.parents.length > 0 ? (
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {student.parents.map((ps) => (
              <div key={ps.parentId} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.75rem 1rem", background:"#d1fae5", borderRadius:"0.75rem" }}>
                <span style={{ fontSize:"1.5rem" }}>✅</span>
                <div>
                  <div style={{ fontWeight:"600", color:"#065f46" }}>Parent account active</div>
                  <div style={{ fontSize:"0.8rem", color:"#047857" }}>{ps.parent.user.firstName} {ps.parent.user.lastName} — {ps.parent.user.email}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CreateParentAccountButton studentId={id} studentName={`${student.user.firstName} ${student.user.lastName}`} />
        )}
      </div>
    </div>
  );
}

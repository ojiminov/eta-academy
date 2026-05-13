import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      groupStudents: {
        where: { isActive: true },
        include: { group: { include: { teacher: { include: { user: true } } } } },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!student) notFound();

  const totalPaid = student.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const statusColors: Record<string, string> = {
    PAID: "badge-green",
    PENDING: "badge-yellow",
    OVERDUE: "badge-red",
    CANCELLED: "badge-gray",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/admin/students" style={{ color: "#6366f1", textDecoration: "none", fontSize: "0.875rem" }}>← Students</Link>
      </div>

      {/* Profile header */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "700", fontSize: "1.5rem", flexShrink: 0,
        }}>
          {student.user.firstName.charAt(0)}{student.user.lastName.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>
            {student.user.firstName} {student.user.lastName}
          </h1>
          <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.375rem" }}>{student.user.email}</div>
          {student.user.phone && (
            <div style={{ fontSize: "0.875rem", color: "#64748b" }}>📞 {student.user.phone}</div>
          )}
          {student.parentName && (
            <div style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
              👨‍👩‍👦 Parent: {student.parentName}{student.parentPhone ? ` · ${student.parentPhone}` : ""}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="badge badge-blue" style={{ display: "block", marginBottom: "0.5rem" }}>
            {student.englishLevel.replace(/_/g, " ")}
          </span>
          <span className={`badge ${student.user.isActive ? "badge-green" : "badge-gray"}`}>
            {student.user.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Enrolled groups */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", marginBottom: "1rem" }}>Enrolled Groups</h2>
          {student.groupStudents.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Not enrolled in any group.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {student.groupStudents.map((gs) => (
                <Link key={gs.id} href={`/admin/groups/${gs.group.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0", cursor: "pointer",
                  }}>
                    <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "0.875rem" }}>{gs.group.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>Payments</h2>
            <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: "600" }}>
              {totalPaid.toLocaleString()} UZS paid
            </span>
          </div>
          {student.payments.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>No payments recorded.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {student.payments.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
                  <div>
                    <div style={{ fontWeight: "500" }}>{p.amount.toLocaleString()} UZS</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString("en-GB")
                        : new Date(p.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                  <span className={`badge ${statusColors[p.status] || "badge-gray"}`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

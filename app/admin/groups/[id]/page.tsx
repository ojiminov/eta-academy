import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      teacher: { include: { user: true } },
      groupStudents: {
        where: { isActive: true },
        include: { student: { include: { user: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!group) notFound();

  const fillPercent = Math.min((group.groupStudents.length / group.maxStudents) * 100, 100);

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <Link href="/admin/groups" style={{ color: "var(--primary, #6366f1)", textDecoration: "none", fontSize: "0.875rem" }}>← Groups</Link>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{group.name}</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{group.level.replace(/_/g, " ")} · {group.schedule}</p>
        </div>
        <span className={`badge ${group.isActive ? "badge-green" : "badge-gray"}`} style={{ fontSize: "0.875rem", padding: "0.4rem 0.8rem" }}>
          {group.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Info card */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", marginBottom: "1rem" }}>Group Info</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { icon: "👨‍🏫", label: "Teacher", value: `${group.teacher.user.firstName} ${group.teacher.user.lastName}` },
              { icon: "🕐", label: "Schedule", value: group.schedule },
              { icon: "💰", label: "Monthly Fee", value: `${group.monthlyFee.toLocaleString()} UZS` },
              { icon: "📅", label: "Started", value: new Date(group.startDate).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) },
              { icon: "👥", label: "Capacity", value: `${group.groupStudents.length} / ${group.maxStudents} students` },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem" }}>
                <span style={{ fontSize: "1.1rem", width: "24px" }}>{item.icon}</span>
                <span style={{ color: "#64748b", width: "90px", flexShrink: 0 }}>{item.label}</span>
                <span style={{ color: "#1e293b", fontWeight: "500" }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Fill bar */}
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.375rem" }}>
              <span>Enrollment</span>
              <span>{Math.round(fillPercent)}%</span>
            </div>
            <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${fillPercent}%`,
                background: fillPercent >= 100 ? "#ef4444" : fillPercent >= 80 ? "#f59e0b" : "var(--primary, #6366f1)",
                borderRadius: "4px",
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        </div>

        {/* Students card */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "1.25rem 1.5rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>
              Students ({group.groupStudents.length})
            </h2>
          </div>
          {group.groupStudents.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
              No students enrolled yet.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {group.groupStudents.map((gs) => (
                  <tr key={gs.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{
                          width: "30px", height: "30px", borderRadius: "50%",
                          background: "var(--primary-gradient, linear-gradient(135deg, #6366f1, #4f46e5))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontWeight: "700", fontSize: "0.75rem", flexShrink: 0,
                        }}>
                          {gs.student.user.firstName.charAt(0)}{gs.student.user.lastName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                          {gs.student.user.firstName} {gs.student.user.lastName}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.8rem" }}>{gs.student.user.email}</td>
                    <td style={{ color: "#64748b", fontSize: "0.8rem" }}>
                      {new Date(gs.joinedAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

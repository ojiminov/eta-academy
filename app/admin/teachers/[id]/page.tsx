import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: true,
      groups: {
        include: {
          groupStudents: { where: { isActive: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!teacher) notFound();

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/admin/teachers" style={{ color: "var(--primary, #6366f1)", textDecoration: "none", fontSize: "0.875rem" }}>← Teachers</Link>
      </div>

      {/* Profile header */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981, #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "700", fontSize: "1.5rem", flexShrink: 0,
        }}>
          {teacher.user.firstName.charAt(0)}{teacher.user.lastName.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>
            {teacher.user.firstName} {teacher.user.lastName}
          </h1>
          <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>{teacher.user.email}</div>
          {teacher.user.phone && (
            <div style={{ fontSize: "0.875rem", color: "#64748b" }}>📞 {teacher.user.phone}</div>
          )}
          {teacher.bio && (
            <p style={{ fontSize: "0.875rem", color: "#475569", marginTop: "0.5rem", marginBottom: 0 }}>{teacher.bio}</p>
          )}
        </div>
        <span className={`badge ${teacher.user.isActive ? "badge-green" : "badge-gray"}`}>
          {teacher.user.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Groups */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>
            Groups ({teacher.groups.length})
          </h2>
        </div>
        {teacher.groups.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
            No groups assigned yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Level</th>
                <th>Schedule</th>
                <th>Students</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teacher.groups.map((g) => (
                <tr key={g.id}>
                  <td>
                    <Link href={`/admin/groups/${g.id}`} style={{ color: "var(--primary, #6366f1)", textDecoration: "none", fontWeight: "500" }}>
                      {g.name}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-blue">{g.level.replace(/_/g, " ")}</span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.875rem" }}>{g.schedule}</td>
                  <td style={{ fontSize: "0.875rem" }}>{g.groupStudents.length} / {g.maxStudents}</td>
                  <td>
                    <span className={`badge ${g.isActive ? "badge-green" : "badge-gray"}`}>
                      {g.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

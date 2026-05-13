import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
      groups: { where: { isActive: true } },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>Teachers</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{teachers.length} teachers on staff</p>
        </div>
        <Link href="/admin/teachers/new" className="btn btn-primary">+ Add Teacher</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Phone</th>
              <th>Active Groups</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                  No teachers yet. <Link href="/admin/teachers/new" style={{ color: "#6366f1" }}>Add the first teacher</Link>
                </td>
              </tr>
            ) : (
              teachers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: "700", fontSize: "0.875rem", flexShrink: 0,
                      }}>
                        {t.user.firstName.charAt(0)}{t.user.lastName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: "500" }}>{t.user.firstName} {t.user.lastName}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{t.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.875rem" }}>{t.user.phone || "—"}</td>
                  <td>
                    <span className="badge badge-blue">{t.groups.length} groups</span>
                  </td>
                  <td>
                    <span className={`badge ${t.user.isActive ? "badge-green" : "badge-gray"}`}>
                      {t.user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/teachers/${t.id}`} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.375rem 0.625rem" }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

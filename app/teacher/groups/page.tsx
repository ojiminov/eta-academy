import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeacherGroupsPage() {
  const user = await getCurrentUser();
  const teacher = user?.teacher;

  const groups = teacher
    ? await prisma.group.findMany({
        where: { teacherId: teacher.id },
        include: {
          groupStudents: { where: { isActive: true } },
          classSessions: { orderBy: { scheduledAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const levelColors: Record<string, string> = {
    BEGINNER: "badge-gray",
    ELEMENTARY: "badge-blue",
    PRE_INTERMEDIATE: "badge-blue",
    INTERMEDIATE: "badge-yellow",
    UPPER_INTERMEDIATE: "badge-yellow",
    ADVANCED: "badge-green",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>My Groups</h1>
        <p style={{ color: "#64748b", margin: 0 }}>{groups.filter((g) => g.isActive).length} active groups</p>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
          <h3 style={{ color: "#1e293b" }}>No groups assigned yet</h3>
          <p style={{ color: "#64748b" }}>The admin will assign groups to you.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {groups.map((g) => (
            <div key={g.id} className="card" style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: "0 0 0.25rem" }}>{g.name}</h3>
                  <span className={`badge ${levelColors[g.level] || "badge-blue"}`}>{g.level.replace(/_/g, " ")}</span>
                </div>
                <span className={`badge ${g.isActive ? "badge-green" : "badge-gray"}`}>
                  {g.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                  <span>🕐</span><span>{g.schedule}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                  <span>👥</span><span>{g.groupStudents.length} / {g.maxStudents} students</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                  <span>📅</span>
                  <span>
                    {g.classSessions[0]
                      ? `Last session: ${new Date(g.classSessions[0].scheduledAt).toLocaleDateString()}`
                      : "No sessions yet"}
                  </span>
                </div>
              </div>

              {/* Fill bar */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min((g.groupStudents.length / g.maxStudents) * 100, 100)}%`,
                    background: g.groupStudents.length >= g.maxStudents ? "#ef4444" : "#10b981",
                    borderRadius: "3px",
                  }} />
                </div>
              </div>

              <Link
                href={`/teacher/groups/${g.id}`}
                className="btn btn-secondary"
                style={{ width: "100%", textAlign: "center", display: "block" }}
              >
                Manage Group →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

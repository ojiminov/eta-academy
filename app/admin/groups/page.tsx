import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groups = await prisma.group.findMany({
    include: {
      teacher: { include: { user: true } },
      groupStudents: { where: { isActive: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>Groups</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{groups.filter(g => g.isActive).length} active groups</p>
        </div>
        <Link href="/admin/groups/new" className="btn btn-primary">+ New Group</Link>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
          <h3 style={{ color: "#1e293b", marginBottom: "0.5rem" }}>No groups yet</h3>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Create your first class group to get started.</p>
          <Link href="/admin/groups/new" className="btn btn-primary">+ Create First Group</Link>
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
                  <span>👨‍🏫</span>
                  <span>{g.teacher.user.firstName} {g.teacher.user.lastName}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                  <span>🕐</span>
                  <span>{g.schedule}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                  <span>👥</span>
                  <span>{g.groupStudents.length} / {g.maxStudents} students</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                  <span>💰</span>
                  <span>{g.monthlyFee.toLocaleString()} UZS/month</span>
                </div>
              </div>

              {/* Student fill bar */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min((g.groupStudents.length / g.maxStudents) * 100, 100)}%`,
                    background: g.groupStudents.length >= g.maxStudents ? "#ef4444" : "#6366f1",
                    borderRadius: "3px",
                    transition: "width 0.3s",
                  }} />
                </div>
              </div>

              <Link href={`/admin/groups/${g.id}`} className="btn btn-secondary" style={{ width: "100%", textAlign: "center", display: "block" }}>
                Manage Group
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentGroupsPage() {
  const user = await getCurrentUser();
  const student = user?.student;

  const groupStudents = student
    ? await prisma.groupStudent.findMany({
        where: { studentId: student.id, isActive: true },
        include: {
          group: {
            include: {
              teacher: { include: { user: true } },
              groupStudents: { where: { isActive: true } },
              classSessions: {
                where: { isCompleted: false },
                orderBy: { scheduledAt: "asc" },
                take: 3,
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
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
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>My Classes</h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          {groupStudents.length} {groupStudents.length === 1 ? "class" : "classes"} enrolled
        </p>
      </div>

      {groupStudents.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
          <h3 style={{ color: "#1e293b" }}>No classes yet</h3>
          <p style={{ color: "#64748b" }}>You will be enrolled in a class by the admin.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {groupStudents.map(({ group, joinedAt }) => (
            <div key={group.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.5rem" }}>{group.name}</h2>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className={`badge ${levelColors[group.level] || "badge-blue"}`}>
                      {group.level.replace(/_/g, " ")}
                    </span>
                    <span className="badge badge-green">Active</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#64748b" }}>
                  Joined {new Date(joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                    <span>👨‍🏫</span>
                    <span>{group.teacher.user.firstName} {group.teacher.user.lastName}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                    <span>🕐</span>
                    <span>{group.schedule}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                    <span>👥</span>
                    <span>{group.groupStudents.length} / {group.maxStudents} students</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                    <span>💰</span>
                    <span>{group.monthlyFee.toLocaleString()} UZS/month</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#64748b", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Upcoming Sessions
                  </div>
                  {group.classSessions.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No upcoming sessions</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {group.classSessions.map((s) => (
                        <div key={s.id} style={{ fontSize: "0.8rem", color: "#1e293b", background: "#f8fafc", borderRadius: "0.5rem", padding: "0.4rem 0.6rem" }}>
                          <span style={{ fontWeight: "500" }}>
                            {new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          {" · "}
                          <span style={{ color: "#64748b" }}>
                            {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {s.topic && <span style={{ color: "#6366f1" }}> · {s.topic}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {group.teacher.user.phone && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>
                  📞 Teacher contact: {group.teacher.user.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeacherAttendancePage() {
  const user = await getCurrentUser();
  const teacher = user?.teacher;

  // Get all completed sessions with attendance
  const sessions = teacher
    ? await prisma.classSession.findMany({
        where: { teacherId: teacher.id, isCompleted: true },
        include: {
          group: true,
          attendances: {
            include: {
              classSession: true,
            },
          },
        },
        orderBy: { scheduledAt: "desc" },
        take: 20,
      })
    : [];

  // Get all groups with their students for attendance summary
  const groups = teacher
    ? await prisma.group.findMany({
        where: { teacherId: teacher.id, isActive: true },
        include: {
          groupStudents: {
            where: { isActive: true },
            include: { student: { include: { user: true } } },
          },
          classSessions: {
            where: { isCompleted: true },
            include: { attendances: true },
          },
        },
      })
    : [];

  const statusColor: Record<string, string> = {
    PRESENT: "badge-green",
    ABSENT: "badge-red",
    LATE: "badge-yellow",
    EXCUSED: "badge-gray",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>Attendance</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Attendance records from completed sessions</p>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h3 style={{ color: "#1e293b" }}>No groups assigned</h3>
          <p style={{ color: "#64748b" }}>You need groups with completed sessions to view attendance.</p>
        </div>
      ) : (
        <>
          {/* Attendance summary per group */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {groups.map((g) => {
              const totalAttendances = g.classSessions.flatMap((s) => s.attendances).length;
              const presentCount = g.classSessions.flatMap((s) => s.attendances).filter((a) => a.status === "PRESENT").length;
              const rate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : null;

              return (
                <div key={g.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{g.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{g.groupStudents.length} students</div>
                    </div>
                    {rate !== null && (
                      <div style={{
                        fontWeight: "700",
                        fontSize: "1.25rem",
                        color: rate >= 80 ? "#10b981" : rate >= 60 ? "#f59e0b" : "#ef4444",
                      }}>
                        {rate}%
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {g.classSessions.length} sessions completed · {totalAttendances} records
                  </div>
                  <div style={{ marginTop: "0.75rem", height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${rate ?? 0}%`,
                      background: (rate ?? 0) >= 80 ? "#10b981" : (rate ?? 0) >= 60 ? "#f59e0b" : "#ef4444",
                      borderRadius: "3px",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent session attendance */}
          {sessions.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  Recent Session Records
                </h2>
              </div>
              {sessions.map((session) => (
                <div key={session.id} style={{ borderTop: "1px solid #f1f5f9", padding: "1rem 1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "#1e293b" }}>
                        {session.group.name} — {session.topic || "Session"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {new Date(session.scheduledAt).toLocaleDateString("en-GB", {
                          weekday: "long", day: "numeric", month: "long", year: "numeric"
                        })}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {session.attendances.filter((a) => a.status === "PRESENT").length}/{session.attendances.length} present
                    </div>
                  </div>
                  {session.attendances.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {session.attendances.map((att) => (
                        <span key={att.id} className={`badge ${statusColor[att.status] || "badge-gray"}`} style={{ fontSize: "0.7rem" }}>
                          {att.status}
                        </span>
                      ))}
                    </div>
                  )}
                  {session.attendances.length === 0 && (
                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0 }}>No attendance recorded for this session.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

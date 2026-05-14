import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeacherSessionsPage() {
  const user = await getCurrentUser();
  const teacher = user?.teacher;

  const sessions = teacher
    ? await prisma.classSession.findMany({
        where: { teacherId: teacher.id },
        include: {
          group: true,
          attendances: true,
          grades: true,
        },
        orderBy: { scheduledAt: "desc" },
      })
    : [];

  const upcoming = sessions.filter((s) => !s.isCompleted);
  const completed = sessions.filter((s) => s.isCompleted);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>Sessions</h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          {upcoming.length} upcoming · {completed.length} completed
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
          <h3 style={{ color: "#1e293b" }}>No sessions yet</h3>
          <p style={{ color: "#64748b" }}>Sessions will appear here once scheduled.</p>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="card" style={{ marginBottom: "1.5rem", padding: 0 }}>
              <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  Upcoming Sessions ({upcoming.length})
                </h2>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Group</th>
                    <th>Topic</th>
                    <th>Duration</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming
                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                    .map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                          {new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ fontWeight: "500" }}>{s.group.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.875rem" }}>{s.topic || "—"}</td>
                      <td style={{ fontSize: "0.875rem", color: "#64748b" }}>{s.duration} min</td>
                      <td>
                        <span className="badge badge-yellow" style={{ fontSize: "0.7rem" }}>Upcoming</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  Completed Sessions ({completed.length})
                </h2>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Group</th>
                    <th>Topic</th>
                    <th>Attendance</th>
                    <th>Grades</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                          {new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ fontWeight: "500" }}>{s.group.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.875rem" }}>{s.topic || "—"}</td>
                      <td style={{ fontSize: "0.875rem" }}>
                        {s.attendances.length > 0
                          ? `${s.attendances.filter((a) => a.status === "PRESENT").length}/${s.attendances.length} present`
                          : <span style={{ color: "#94a3b8" }}>Not recorded</span>}
                      </td>
                      <td style={{ fontSize: "0.875rem" }}>
                        {s.grades.length > 0
                          ? `${s.grades.length} grades`
                          : <span style={{ color: "#94a3b8" }}>No grades</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

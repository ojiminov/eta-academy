import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const teacher = user?.teacher;

  const groups = teacher
    ? await prisma.group.findMany({
        where: { teacherId: teacher.id, isActive: true },
        include: {
          groupStudents: { where: { isActive: true } },
          classSessions: { where: { isCompleted: false }, orderBy: { scheduledAt: "asc" }, take: 3 },
        },
      })
    : [];

  const totalStudents = groups.reduce((sum: number, g) => sum + g.groupStudents.length, 0);

  const upcomingSessions = groups
    .flatMap((g) => g.classSessions.map((s) => ({ ...s, groupName: g.name })))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ padding: "0", maxWidth: "100%" }}>

      {/* Hero banner */}
      <div style={{
        background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
        padding: "2rem 2.5rem 3.5rem",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: "-60px", right: "120px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.875rem", margin: "0 0 0.375rem", fontWeight: "500" }}>{today}</p>
          <h1 style={{ color: "white", fontSize: "1.875rem", fontWeight: "800", margin: "0 0 0.375rem", letterSpacing: "-0.025em" }}>
            {t("dashboard.teacherTitle", { name: user?.firstName ?? "" })} 👋
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.9rem" }}>{t("dashboard.teacherSubtitle")}</p>
        </div>
      </div>

      {/* Stat cards — overlap the banner */}
      <div style={{ padding: "0 2rem", marginTop: "-1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[
            { label: t("dashboard.activeGroups"), value: groups.length, sub: "assigned to you", color: "#10b981", light: "#d1fae5" },
            { label: t("dashboard.totalStudents"), value: totalStudents, sub: "across all groups", color: "#6366f1", light: "#ede9fe" },
            { label: t("dashboard.upcomingSessions"), value: upcomingSessions.length, sub: "scheduled ahead", color: "#f59e0b", light: "#fef3c7" },
          ].map((card) => (
            <div key={card.label} style={{
              background: "white",
              borderRadius: "1rem",
              padding: "1.375rem 1.5rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: card.color }} />
              <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", background: card.light, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: card.color }} />
              </div>
              <div style={{ fontSize: "2.25rem", fontWeight: "800", color: "#0f172a", lineHeight: 1, letterSpacing: "-0.025em" }}>{card.value}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</div>
              <div style={{ fontSize: "0.72rem", color: "#cbd5e1", marginTop: "0.125rem" }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: "1.5rem 2rem 2rem", display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem" }}>

        {/* My groups */}
        <div style={{ background: "white", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("nav.myGroups")}</h2>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.125rem 0 0" }}>Your active classes</p>
            </div>
            <Link href="/teacher/groups" style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: "600", textDecoration: "none", padding: "0.375rem 0.75rem", background: "#f0fdf4", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
              View all
            </Link>
          </div>
          {groups.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📚</div>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{t("groups.noGroupsAssigned")}</div>
            </div>
          ) : (
            <div>
              {groups.map((g, i) => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.5rem", borderBottom: i < groups.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "0.625rem", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem", flexShrink: 0 }}>
                    📚
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>{g.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{g.schedule}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0f172a" }}>{g.groupStudents.length}</div>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.03em" }}>students</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming sessions */}
        <div style={{ background: "white", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("dashboard.upcomingSessions")}</h2>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.125rem 0 0" }}>Scheduled classes</p>
          </div>
          <div style={{ padding: "0.75rem" }}>
            {upcomingSessions.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>{t("sessions.noSessions")}</div>
            ) : (
              upcomingSessions.map((s) => (
                <div key={s.id} style={{ padding: "0.75rem", borderRadius: "0.625rem", marginBottom: "0.375rem", background: "#f8fafc" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#0f172a" }}>{s.groupName}</div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.125rem" }}>
                    {new Date(s.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {s.topic && <div style={{ fontSize: "0.7rem", color: "#10b981", marginTop: "0.125rem", fontWeight: "500" }}>{s.topic}</div>}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

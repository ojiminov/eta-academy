import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  BEGINNER:          { bg: "#f1f5f9", color: "#475569" },
  ELEMENTARY:        { bg: "#dbeafe", color: "#1e40af" },
  PRE_INTERMEDIATE:  { bg: "#dbeafe", color: "#1e40af" },
  INTERMEDIATE:      { bg: "#fef9c3", color: "#854d0e" },
  UPPER_INTERMEDIATE:{ bg: "#fef3c7", color: "#b45309" },
  ADVANCED:          { bg: "#dcfce7", color: "#166534" },
};

export default async function TeacherGroupsPage() {
  const t = await getTranslations();
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

  const activeGroups = groups.filter(g => g.isActive);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{t("nav.myGroups")}</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
            {activeGroups.length} active &middot; {groups.length} total
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>📚</div>
          <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "0.375rem" }}>{t("groups.noGroupsAssigned")}</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>{t("groups.adminWillAssign")}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {groups.map((g) => {
            const fillPct = Math.min((g.groupStudents.length / g.maxStudents) * 100, 100);
            const isFull = g.groupStudents.length >= g.maxStudents;
            const levelStyle = LEVEL_STYLE[g.level] || { bg: "#dbeafe", color: "#1e40af" };
            return (
              <div key={g.id} style={{
                background: "white", border: "1px solid #e2e8f0",
                borderRadius: "0.875rem", padding: "1.375rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                opacity: g.isActive ? 1 : 0.65,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: "600", color: "#0f172a", marginBottom: "0.375rem" }}>{g.name}</div>
                    <span style={{ display: "inline-flex", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600", background: levelStyle.bg, color: levelStyle.color }}>
                      {t(`levels.${g.level}`)}
                    </span>
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.2rem 0.625rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600",
                    ...(g.isActive ? { background: "#dcfce7", color: "#16a34a" } : { background: "#f1f5f9", color: "#64748b" }),
                  }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: g.isActive ? "#16a34a" : "#94a3b8" }} />
                    {g.isActive ? t("common.active") : t("common.inactive")}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.125rem" }}>
                  {[
                    { icon: "🕐", text: g.schedule },
                    { icon: "👥", text: `${g.groupStudents.length} / ${g.maxStudents} students` },
                    { icon: "📅", text: g.classSessions[0] ? `Last session: ${new Date(g.classSessions[0].scheduledAt).toLocaleDateString()}` : "No sessions yet" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#475569" }}>
                      <span style={{ fontSize: "0.875rem", width: "18px", textAlign: "center" }}>{row.icon}</span>
                      <span>{row.text}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: "1.125rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "500", color: "#64748b" }}>Capacity</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: "600", color: isFull ? "#dc2626" : "#475569" }}>
                      {g.groupStudents.length} / {g.maxStudents}{isFull && " · Full"}
                    </span>
                  </div>
                  <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${fillPct}%`, background: isFull ? "#ef4444" : fillPct > 80 ? "#f59e0b" : "#10b981", borderRadius: "9999px" }} />
                  </div>
                </div>

                <Link href={`/teacher/groups/${g.id}`} style={{
                  display: "block", textAlign: "center", padding: "0.625rem",
                  borderRadius: "0.5rem", border: "1px solid #e2e8f0",
                  fontSize: "0.8rem", fontWeight: "600", color: "#475569",
                  textDecoration: "none", background: "#f8fafc",
                }}>
                  {t("common.manageGroup")}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

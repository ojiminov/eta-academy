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

export default async function GroupsPage() {
  const t = await getTranslations();
  const groups = await prisma.group.findMany({
    include: {
      teacher: { include: { user: true } },
      groupStudents: { where: { isActive: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeGroups = groups.filter(g => g.isActive);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>
            {t("groups.title")}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
            {activeGroups.length} active &middot; {groups.length} total
          </p>
        </div>
        <Link href="/admin/groups/new" className="btn btn-primary" style={{ gap: "0.375rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t("groups.newGroup")}
        </Link>
      </div>

      {groups.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>📚</div>
          <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "0.375rem" }}>{t("groups.noGroups")}</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{t("groups.noGroupsDesc")}</div>
          <Link href="/admin/groups/new" className="btn btn-primary">{t("groups.createFirst")}</Link>
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
                {/* Top row */}
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

                {/* Info rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.125rem" }}>
                  {[
                    { icon: "👨‍🏫", text: `${g.teacher.user.firstName} ${g.teacher.user.lastName}` },
                    { icon: "🕐", text: g.schedule },
                    { icon: "💰", text: `${g.monthlyFee.toLocaleString()} UZS / mo` },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#475569" }}>
                      <span style={{ fontSize: "0.875rem", width: "18px", textAlign: "center" }}>{row.icon}</span>
                      <span>{row.text}</span>
                    </div>
                  ))}
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: "1.125rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "500", color: "#64748b" }}>Capacity</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: "600", color: isFull ? "#dc2626" : "#475569" }}>
                      {g.groupStudents.length} / {g.maxStudents}
                      {isFull && " · Full"}
                    </span>
                  </div>
                  <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${fillPct}%`,
                      background: isFull ? "#ef4444" : fillPct > 80 ? "#f59e0b" : "var(--primary, #6366f1)",
                      borderRadius: "9999px",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>

                <Link href={`/admin/groups/${g.id}`} style={{
                  display: "block", textAlign: "center", padding: "0.625rem",
                  borderRadius: "0.5rem", border: "1px solid #e2e8f0",
                  fontSize: "0.8rem", fontWeight: "600", color: "#475569",
                  textDecoration: "none", background: "#f8fafc",
                  transition: "all 0.15s",
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

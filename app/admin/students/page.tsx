import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = ["#6366f1","#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default async function StudentsPage() {
  const t = await getTranslations();
  const students = await prisma.student.findMany({
    include: {
      user: true,
      groupStudents: {
        where: { isActive: true },
        include: { group: true },
      },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  const activeCount = students.filter(s => s.user.isActive).length;

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>
            {t("students.title")}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
            {students.length} enrolled &middot; {activeCount} active
          </p>
        </div>
        <Link href="/admin/students/new" className="btn btn-primary" style={{ gap: "0.375rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t("students.newStudent")}
        </Link>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Student
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("groups.level")}
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("nav.groups")}
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("common.phone")}
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("common.status")}
              </th>
              <th style={{ padding: "0.75rem 1.25rem", textAlign: "right", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "4rem", textAlign: "center" }}>
                  <div style={{ color: "#94a3b8", fontSize: "2rem", marginBottom: "0.75rem" }}>👨‍🎓</div>
                  <div style={{ fontWeight: "500", color: "#475569", marginBottom: "0.375rem" }}>{t("students.noStudents")}</div>
                  <Link href="/admin/students/new" style={{ color: "var(--primary, #6366f1)", fontSize: "0.875rem", fontWeight: "500", textDecoration: "none" }}>
                    {t("students.newStudent")} →
                  </Link>
                </td>
              </tr>
            ) : (
              students.map((s, i) => {
                const name = `${s.user.firstName} ${s.user.lastName}`;
                const color = avatarColor(name);
                return (
                  <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background 0.1s" }}>
                    <td style={{ padding: "0.875rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          background: color, display: "flex", alignItems: "center",
                          justifyContent: "center", color: "white", fontSize: "0.75rem",
                          fontWeight: "700", flexShrink: 0,
                        }}>
                          {`${s.user.firstName.charAt(0)}${s.user.lastName.charAt(0)}`.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>{name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{s.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ display: "inline-flex", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: "600", background: "var(--primary-light, #ede9fe)", color: "#5b21b6" }}>
                        {t(`levels.${s.englishLevel}`)}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      {s.groupStudents.length === 0 ? (
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>—</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          {s.groupStudents.map((gs) => (
                            <span key={gs.id} style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "500" }}>{gs.group.name}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#475569" }}>
                      {s.user.phone || <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: "600",
                        ...(s.user.isActive
                          ? { background: "#dcfce7", color: "#16a34a" }
                          : { background: "#f1f5f9", color: "#64748b" }),
                      }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.user.isActive ? "#16a34a" : "#94a3b8", flexShrink: 0 }} />
                        {s.user.isActive ? t("common.active") : t("common.inactive")}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                      <Link href={`/admin/students/${s.id}`} style={{
                        fontSize: "0.8rem", fontWeight: "500", color: "var(--primary, #6366f1)",
                        textDecoration: "none", padding: "0.375rem 0.75rem",
                        border: "1px solid #e0e7ff", borderRadius: "0.4rem",
                        background: "#f5f3ff", display: "inline-block",
                      }}>
                        {t("common.view")}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

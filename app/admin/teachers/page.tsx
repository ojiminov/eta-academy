import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const t = await getTranslations();
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
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{t("teachers.title")}</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{t("teachers.onStaff", { count: teachers.length })}</p>
        </div>
        <Link href="/admin/teachers/new" className="btn btn-primary">{t("teachers.newTeacher")}</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{t("teachers.title")}</th>
              <th>{t("common.phone")}</th>
              <th>{t("teachers.activeGroups")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                  {t("teachers.noTeachers")}. <Link href="/admin/teachers/new" style={{ color: "var(--primary, #6366f1)" }}>{t("teachers.newTeacher")}</Link>
                </td>
              </tr>
            ) : (
              teachers.map((t2) => (
                <tr key={t2.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: "700", fontSize: "0.875rem", flexShrink: 0,
                      }}>
                        {t2.user.firstName.charAt(0)}{t2.user.lastName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: "500" }}>{t2.user.firstName} {t2.user.lastName}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{t2.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.875rem" }}>{t2.user.phone || "—"}</td>
                  <td>
                    <span className="badge badge-blue">{t2.groups.length}</span>
                  </td>
                  <td>
                    <span className={`badge ${t2.user.isActive ? "badge-green" : "badge-gray"}`}>
                      {t2.user.isActive ? t("common.active") : t("common.inactive")}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/teachers/${t2.id}`} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.375rem 0.625rem" }}>
                      {t("common.view")}
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

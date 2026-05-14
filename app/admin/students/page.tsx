import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

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

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{t("students.title")}</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{t("students.enrolledCount", { count: students.length })}</p>
        </div>
        <Link href="/admin/students/new" className="btn btn-primary">
          {t("students.newStudent")}
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{t("grades.student")}</th>
              <th>{t("groups.level")}</th>
              <th>{t("nav.groups")}</th>
              <th>{t("common.phone")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                  {t("students.noStudents")}. <Link href="/admin/students/new" style={{ color: "#6366f1" }}>{t("students.newStudent")}</Link>
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {s.user.firstName} {s.user.lastName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{s.user.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-blue">{t(`levels.${s.englishLevel}`)}</span>
                  </td>
                  <td>
                    {s.groupStudents.length === 0 ? (
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{t("students.noGroup")}</span>
                    ) : (
                      s.groupStudents.map((gs) => (
                        <div key={gs.id} style={{ fontSize: "0.8rem" }}>{gs.group.name}</div>
                      ))
                    )}
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.875rem" }}>
                    {s.user.phone || "—"}
                  </td>
                  <td>
                    <span className={`badge ${s.user.isActive ? "badge-green" : "badge-gray"}`}>
                      {s.user.isActive ? t("common.active") : t("common.inactive")}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/students/${s.id}`} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.375rem 0.625rem" }}>
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

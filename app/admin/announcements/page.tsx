import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const t = await getTranslations();
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  const targetLabel: Record<string, string> = {
    TEACHER: t("announcements.teachersOnly"),
    STUDENT: t("announcements.studentsOnly"),
    ADMIN: t("announcements.adminsOnly"),
  };

  const targetBadge: Record<string, string> = {
    TEACHER: "badge-blue",
    STUDENT: "badge-green",
    ADMIN: "badge-yellow",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{t("announcements.title")}</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{t("announcements.totalCount", { count: announcements.length })}</p>
        </div>
        <Link href="/admin/announcements/new" className="btn btn-primary">{t("announcements.newAnnouncement")}</Link>
      </div>

      {announcements.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📢</div>
          <h3 style={{ color: "#1e293b", marginBottom: "0.5rem" }}>{t("announcements.noAnnouncements")}</h3>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>{t("announcements.postFirst")}</p>
          <Link href="/admin/announcements/new" className="btn btn-primary">{t("announcements.newAnnouncement")}</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {announcements.map((a) => (
            <div key={a.id} className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>{a.title}</h3>
                    <span className={`badge ${a.targetRole ? targetBadge[a.targetRole] : "badge-gray"}`}>
                      {a.targetRole ? targetLabel[a.targetRole] : t("announcements.everyone")}
                    </span>
                  </div>
                  <p style={{ color: "#475569", fontSize: "0.875rem", margin: "0 0 0.5rem", lineHeight: "1.5" }}>
                    {a.body}
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    📅 {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

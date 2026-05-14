import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const t = await getTranslations();
  const payments = await prisma.payment.findMany({
    include: {
      student: { include: { user: true } },
      invoice: { include: { group: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverdue = payments
    .filter((p) => p.status === "OVERDUE")
    .reduce((sum, p) => sum + p.amount, 0);

  const statusColors: Record<string, string> = {
    PAID: "badge-green",
    PENDING: "badge-yellow",
    OVERDUE: "badge-red",
    CANCELLED: "badge-gray",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{t("payments.title")}</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{t("payments.totalRecords", { count: payments.length })}</p>
        </div>
        <Link href="/admin/payments/new" className="btn btn-primary">{t("payments.newPayment")}</Link>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("payments.collected"), value: totalPaid, color: "#10b981", bg: "#d1fae5", icon: "✅" },
          { label: t("payments.pending"), value: totalPending, color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
          { label: t("payments.overdue"), value: totalOverdue, color: "#ef4444", bg: "#fee2e2", icon: "⚠️" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: s.bg, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "1.4rem", flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: s.color }}>
                {s.value.toLocaleString()} UZS
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{t("grades.student")}</th>
              <th>{t("sessions.group")}</th>
              <th>{t("payments.amount")}</th>
              <th>{t("payments.method")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.date")}</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                  {t("payments.noPayments")}
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {p.student.user.firstName} {p.student.user.lastName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{p.student.user.email}</div>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.875rem" }}>
                    {p.invoice?.group?.name || "—"}
                  </td>
                  <td style={{ fontWeight: "600" }}>{p.amount.toLocaleString()} UZS</td>
                  <td style={{ color: "#64748b", fontSize: "0.875rem" }}>
                    {p.method ? (t(`payments.${p.method}`) || p.method) : "—"}
                  </td>
                  <td>
                    <span className={`badge ${statusColors[p.status] || "badge-gray"}`}>
                      {t(`payments.${p.status}`)}
                    </span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.875rem" }}>
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString()
                      : new Date(p.createdAt).toLocaleDateString()}
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

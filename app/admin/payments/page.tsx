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

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  PAID:      { bg: "#dcfce7", color: "#16a34a", dot: "#16a34a" },
  PENDING:   { bg: "#fef9c3", color: "#ca8a04", dot: "#ca8a04" },
  OVERDUE:   { bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
};

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

  const totalPaid    = payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);

  const summaryCards = [
    { label: t("payments.collected"), value: totalPaid,    color: "#10b981", bg: "#d1fae5", borderColor: "#10b981" },
    { label: t("payments.pending"),   value: totalPending, color: "#f59e0b", bg: "#fef3c7", borderColor: "#f59e0b" },
    { label: t("payments.overdue"),   value: totalOverdue, color: "#ef4444", bg: "#fee2e2", borderColor: "#ef4444" },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>
            {t("payments.title")}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
            {t("payments.totalRecords", { count: payments.length })}
          </p>
        </div>
        <Link href="/admin/payments/new" className="btn btn-primary" style={{ gap: "0.375rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t("payments.newPayment")}
        </Link>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
        {summaryCards.map((s) => (
          <div key={s.label} style={{
            background: "white", border: "1px solid #e2e8f0",
            borderTop: `3px solid ${s.borderColor}`,
            borderRadius: "0.875rem", padding: "1.25rem 1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "1.625rem", fontWeight: "800", color: s.color, lineHeight: 1 }}>
              {(s.value / 1_000_000).toFixed(2)}M
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.25rem" }}>UZS</div>
          </div>
        ))}
      </div>

      {/* Payments table */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {[t("grades.student"), t("sessions.group"), t("payments.amount"), t("payments.method"), t("common.status"), t("common.date")].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                  {t("payments.noPayments")}
                </td>
              </tr>
            ) : (
              payments.map((p, i) => {
                const name = `${p.student.user.firstName} ${p.student.user.lastName}`;
                const color = avatarColor(name);
                const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.CANCELLED;
                return (
                  <tr key={p.id} style={{ borderBottom: i < payments.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: color, display: "flex", alignItems: "center",
                          justifyContent: "center", color: "white", fontSize: "0.7rem",
                          fontWeight: "700", flexShrink: 0,
                        }}>
                          {`${p.student.user.firstName.charAt(0)}${p.student.user.lastName.charAt(0)}`.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>{name}</div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{p.student.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#475569" }}>
                      {p.invoice?.group?.name || <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>{p.amount.toLocaleString()}</div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>UZS</div>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#475569" }}>
                      {p.method || <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.2rem 0.625rem", borderRadius: "9999px",
                        fontSize: "0.7rem", fontWeight: "600",
                        background: st.bg, color: st.color,
                      }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
                        {t(`payments.${p.status}`)}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(p.paidAt ?? p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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

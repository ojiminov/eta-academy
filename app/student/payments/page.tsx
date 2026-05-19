import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  PAID:      { bg: "#dcfce7", color: "#16a34a", dot: "#16a34a", border: "#16a34a" },
  PENDING:   { bg: "#fef9c3", color: "#ca8a04", dot: "#ca8a04", border: "#f59e0b" },
  OVERDUE:   { bg: "#fee2e2", color: "#dc2626", dot: "#dc2626", border: "#ef4444" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8", border: "#94a3b8" },
};

export default async function StudentPaymentsPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const student = user?.student;

  const payments = student
    ? await prisma.payment.findMany({
        where: { studentId: student.id },
        include: { invoice: { include: { group: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const totalPaid    = payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>{t("payments.title")}</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>{t("payments.studentSubtitle")}</p>
      </div>

      {payments.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>💳</div>
          <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "0.25rem" }}>{t("payments.noPayments")}</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>{t("payments.noPaymentsDesc")}</div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
            {[
              { label: t("payments.totalPaid"), value: totalPaid, color: "#10b981", borderColor: "#10b981" },
              { label: t("payments.pending"),   value: totalPending, color: "#f59e0b", borderColor: "#f59e0b" },
              { label: t("payments.overdue"),   value: totalOverdue, color: "#ef4444", borderColor: "#ef4444" },
            ].map(s => (
              <div key={s.label} style={{
                background: "white", border: "1px solid #e2e8f0",
                borderTop: `3px solid ${s.borderColor}`,
                borderRadius: "0.875rem", padding: "1.25rem 1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: s.color, lineHeight: 1 }}>
                  {(s.value / 1_000_000).toFixed(2)}M
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.25rem" }}>UZS</div>
              </div>
            ))}
          </div>

          {/* Overdue alert */}
          {totalOverdue > 0 && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: "600", color: "#dc2626", fontSize: "0.9rem" }}>{t("payments.overdueAlert")}</div>
                <div style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: "0.125rem" }}>
                  {t("payments.overdueDesc", { amount: totalOverdue.toLocaleString() })}
                </div>
              </div>
            </div>
          )}

          {/* Payment table */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc" }}>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("payments.history")}</h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {[t("payments.month"), t("payments.class"), t("payments.amount"), t("payments.method"), t("common.status"), t("payments.paidOn")].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => {
                  const st = STATUS_STYLE[p.status] || STATUS_STYLE.CANCELLED;
                  return (
                    <tr key={p.id} style={{ borderBottom: i < payments.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#475569" }}>
                        {p.invoice ? `${monthNames[p.invoice.month - 1]} ${p.invoice.year}` : new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontWeight: "500", fontSize: "0.875rem", color: "#0f172a" }}>
                        {p.invoice?.group?.name ?? <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "#0f172a" }}>{p.amount.toLocaleString()}</div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{p.currency}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#475569" }}>
                        {p.method ? t(`payments.${p.method}`) : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.625rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "600", background: st.bg, color: st.color }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: st.dot }} />
                          {t(`payments.${p.status}`)}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#64748b" }}>
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "0.875rem", padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: "0.625rem", fontSize: "0.78rem", color: "#64748b", border: "1px solid #f1f5f9" }}>
            ℹ️ {t("payments.adminNote")}
          </div>
        </>
      )}
    </div>
  );
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentPaymentsPage() {
  const user = await getCurrentUser();
  const student = user?.student;

  const payments = student
    ? await prisma.payment.findMany({
        where: { studentId: student.id },
        include: { invoice: { include: { group: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);

  const statusColor: Record<string, string> = {
    PAID: "badge-green",
    PENDING: "badge-yellow",
    OVERDUE: "badge-red",
    CANCELLED: "badge-gray",
  };

  const statusIcon: Record<string, string> = {
    PAID: "✅",
    PENDING: "⏳",
    OVERDUE: "⚠️",
    CANCELLED: "❌",
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>Payments</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Your payment history and outstanding balances</p>
      </div>

      {payments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💳</div>
          <h3 style={{ color: "#1e293b" }}>No payment records</h3>
          <p style={{ color: "#64748b" }}>Your payment history will appear here.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Paid", value: totalPaid, color: "#10b981", bg: "#d1fae5", icon: "✅" },
              { label: "Pending", value: totalPending, color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
              { label: "Overdue", value: totalOverdue, color: "#ef4444", bg: "#fee2e2", icon: "⚠️" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "700", color: s.color }}>
                    {s.value.toLocaleString()} UZS
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Overdue alert */}
          {totalOverdue > 0 && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <span style={{ fontSize: "1.25rem" }}>⚠️</span>
              <div>
                <div style={{ fontWeight: "600", color: "#dc2626" }}>Overdue Payment</div>
                <div style={{ fontSize: "0.875rem", color: "#ef4444" }}>
                  You have {totalOverdue.toLocaleString()} UZS in overdue payments. Please contact the admin to resolve this.
                </div>
              </div>
            </div>
          )}

          {/* Payment table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>Payment History</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Class</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Paid On</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontSize: "0.875rem" }}>
                      {p.invoice
                        ? `${monthNames[p.invoice.month - 1]} ${p.invoice.year}`
                        : new Date(p.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </td>
                    <td style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                      {p.invoice?.group?.name ?? "—"}
                    </td>
                    <td style={{ fontWeight: "600", color: "#1e293b" }}>
                      {p.amount.toLocaleString()} {p.currency}
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "#64748b", textTransform: "capitalize" }}>
                      {p.method ?? "—"}
                    </td>
                    <td>
                      <span className={`badge ${statusColor[p.status] || "badge-gray"}`} style={{ fontSize: "0.75rem" }}>
                        {statusIcon[p.status]} {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note */}
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
            💡 For payment questions or issues, please contact the academy admin directly.
          </div>
        </>
      )}
    </div>
  );
}

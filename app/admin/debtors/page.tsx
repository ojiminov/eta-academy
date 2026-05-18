"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Debtor = {
  id: string; name: string; phone?: string; email: string;
  totalOwed: number; pendingCount: number; overdueCount: number;
  daysPending: number; groups: string[]; balance: number;
};

export default function DebtorsPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/debtors").then(r => r.json()).then(setDebtors).finally(() => setLoading(false));
  }, []);

  const totalDebt = debtors.reduce((s, d) => s + d.totalOwed, 0);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>⚠️ Debtors List</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Students with pending or overdue payments</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Debtors", value: debtors.length, icon: "👤", color: "#ef4444", bg: "#fee2e2" },
          { label: "Total Outstanding", value: `${totalDebt.toLocaleString()} UZS`, icon: "💰", color: "#f59e0b", bg: "#fef3c7" },
          { label: "Overdue Accounts", value: debtors.filter(d => d.overdueCount > 0).length, icon: "🔴", color: "#dc2626", bg: "#fef2f2" },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width:48, height:48, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:"1.3rem", fontWeight:"700", color:s.color }}>{s.value}</div>
              <div style={{ fontSize:"0.8rem", color:"#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        ) : debtors.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✅</div>
            <div style={{ fontWeight: "600", color: "#1e293b" }}>No debtors — everyone is up to date!</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Student","Phone","Groups","Amount Owed","Days Pending","Status","Action"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {debtors.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9", background: i%2===0?"white":"#fafafa" }}>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <Link href={`/admin/students/${d.id}`} style={{ fontWeight: "600", color: "var(--primary, #6366f1)", textDecoration: "none" }}>{d.name}</Link>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{d.email}</div>
                  </td>
                  <td style={{ padding: "0.875rem 1rem", color: "#475569", fontSize: "0.875rem" }}>{d.phone || "—"}</td>
                  <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#475569" }}>{d.groups.join(", ") || "—"}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ fontWeight: "700", color: "#dc2626", fontSize: "0.95rem" }}>{d.totalOwed.toLocaleString()} UZS</div>
                    {d.balance !== 0 && <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Balance: {d.balance.toLocaleString()}</div>}
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: "700",
                      background: d.daysPending > 30 ? "#fee2e2" : d.daysPending > 14 ? "#fef3c7" : "#f1f5f9",
                      color: d.daysPending > 30 ? "#dc2626" : d.daysPending > 14 ? "#d97706" : "#475569" }}>
                      {d.daysPending}d
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    {d.overdueCount > 0 && <span className="badge badge-red">{d.overdueCount} overdue</span>}
                    {d.pendingCount > 0 && <span className="badge badge-yellow" style={{ marginLeft: 4 }}>{d.pendingCount} pending</span>}
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <Link href={`/admin/payments?student=${d.id}`} style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", background: "var(--primary, #6366f1)", color: "white", borderRadius: "0.375rem", textDecoration: "none", fontWeight: "600" }}>
                      Collect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

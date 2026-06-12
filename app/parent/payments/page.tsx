"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Payment = { id: string; amount: number; currency: string; status: string; method?: string; paidAt?: string; createdAt: string; notes?: string; };

const STATUS_COLORS: Record<string, { bg:string; color:string }> = {
  PAID:      { bg:"#d1fae5", color:"#065f46" },
  PENDING:   { bg:"#fef3c7", color:"#92400e" },
  OVERDUE:   { bg:"#fee2e2", color:"#991b1b" },
  CANCELLED: { bg:"#f1f5f9", color:"#475569" },
};

export default function ParentPaymentsPage() {
  const t = useTranslations();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/child").then(r=>r.json()).then(d => {
      const allPayments = (d.children ?? []).flatMap((c: { payments?: Payment[] }) => c.payments ?? []);
      if (allPayments.length) setPayments(allPayments);
    }).finally(()=>setLoading(false));
  }, []);

  const totalPaid = payments.filter(p=>p.status==="PAID").reduce((s,p)=>s+p.amount,0);
  const totalPending = payments.filter(p=>p.status==="PENDING"||p.status==="OVERDUE").reduce((s,p)=>s+p.amount,0);

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>💳 {t("parent.childPayments")}</h1>
        <p style={{ color:"#64748b", margin:0 }}>{t("parent.paymentsDesc")}</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {[
          { label: t("parent.totalPaid"), value:`${totalPaid.toLocaleString()} UZS`, icon:"✅", color:"#10b981", bg:"#d1fae5" },
          { label: t("parent.outstanding"), value:`${totalPending.toLocaleString()} UZS`, icon:"⏳", color: totalPending>0?"#ef4444":"#10b981", bg:totalPending>0?"#fee2e2":"#d1fae5" },
          { label: t("parent.totalRecords"), value:payments.length, icon:"📋", color:"var(--primary, #6366f1)", bg:"var(--primary-light, #ede9fe)" },
        ].map(s=>(
          <div key={s.label} className="card" style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <div style={{ width:44,height:44,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontWeight:"700", color:s.color, fontSize:"1.1rem" }}>{s.value}</div>
              <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {totalPending > 0 && (
        <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:"0.75rem", padding:"1rem", marginBottom:"1.5rem", display:"flex", gap:"0.75rem", alignItems:"center" }}>
          <span style={{ fontSize:"1.5rem" }}>⚠️</span>
          <div>
            <div style={{ fontWeight:"600", color:"#991b1b" }}>{t("parent.outstandingBalance")} {totalPending.toLocaleString()} UZS</div>
            <div style={{ fontSize:"0.875rem", color:"#dc2626" }}>{t("parent.contactAcademy")}</div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        {loading ? <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>{t("common.loading")}</div>
          : payments.length===0 ? <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>{t("parent.noPaymentsYet")}</div>
          : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {[t("common.date"), t("payments.amount"), t("payments.method"), t("common.status"), t("common.notes")].map(h=>(
                  <th key={h} style={{ padding:"0.75rem 1rem", textAlign:"left", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", textTransform:"uppercase", borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p,i)=>{
                const sc = STATUS_COLORS[p.status]||STATUS_COLORS.PENDING;
                return (
                  <tr key={p.id} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"white":"#fafafa" }}>
                    <td style={{ padding:"0.875rem 1rem", fontSize:"0.875rem", color:"#475569" }}>{p.paidAt?new Date(p.paidAt).toLocaleDateString():new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding:"0.875rem 1rem", fontWeight:"700", color:"#1e293b" }}>{p.amount.toLocaleString()} {p.currency}</td>
                    <td style={{ padding:"0.875rem 1rem", fontSize:"0.875rem", color:"#64748b", textTransform:"capitalize" }}>{p.method||"—"}</td>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      <span style={{ padding:"0.25rem 0.625rem", borderRadius:"9999px", fontSize:"0.75rem", fontWeight:"700", background:sc.bg, color:sc.color }}>{p.status}</span>
                    </td>
                    <td style={{ padding:"0.875rem 1rem", fontSize:"0.875rem", color:"#64748b" }}>{p.notes||"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

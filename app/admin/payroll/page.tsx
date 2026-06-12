"use client";

import { useState, useEffect } from "react";
import UzbekDatePicker from "@/components/UzbekDatePicker";

type AdvanceFine = { id: string; amount: number; reason?: string; date: string };
type TeacherPayroll = {
  teacher: { id: string; name: string; sharePercent: number };
  collectedRevenue: number;
  earned: number;
  advances: number;
  advanceList: AdvanceFine[];
  fines: number;
  fineList: AdvanceFine[];
  finalSalary: number;
};
type StaffMember = { id: string; name: string; role: string; monthlySalary: number; phone?: string };
type Teacher = { id: string; user: { firstName: string; lastName: string } };

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n));

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<{ payroll: TeacherPayroll[]; staff: StaffMember[] } | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Add advance/fine modal
  const [modal, setModal] = useState<{ type: "advance" | "fine"; teacherId: string; teacherName: string } | null>(null);
  const [modalForm, setModalForm] = useState({ amount: "", reason: "", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  // Add staff modal
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", role: "secretary", monthlySalary: "", phone: "" });
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/payroll?month=${month}&year=${year}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month, year]);
  useEffect(() => {
    fetch("/api/admin/teachers").then(r => r.json()).then(d => Array.isArray(d) && setTeachers(d));
  }, []);

  async function saveModal() {
    if (!modal) return;
    setSaving(true);
    const url = modal.type === "advance" ? "/api/admin/teacher-advances" : "/api/admin/teacher-fines";
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: modal.teacherId, ...modalForm }),
    });
    setModal(null);
    setModalForm({ amount: "", reason: "", date: new Date().toISOString().slice(0, 10) });
    setSaving(false);
    load();
  }

  async function deleteEntry(type: "advance" | "fine", id: string) {
    const url = type === "advance" ? "/api/admin/teacher-advances" : "/api/admin/teacher-fines";
    await fetch(url, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  async function saveStaff() {
    setSaving(true);
    if (editStaff) {
      await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editStaff.id, ...staffForm, monthlySalary: Number(staffForm.monthlySalary) }),
      });
    } else {
      await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...staffForm, monthlySalary: Number(staffForm.monthlySalary) }),
      });
    }
    setStaffModal(false);
    setEditStaff(null);
    setStaffForm({ name: "", role: "secretary", monthlySalary: "", phone: "" });
    setSaving(false);
    load();
  }

  async function deleteStaff(id: string) {
    if (!confirm("Delete staff member?")) return;
    await fetch("/api/admin/staff", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  const months = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e293b", margin: "0 0 0.25rem" }}>💰 Oylik hisob-kitob</h1>
          <p style={{ color: "#64748b", margin: 0 }}>O'qituvchilar va xodimlarning oylik maoshi</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select className="input" style={{ width: "auto" }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Yuklanmoqda...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Jami yig'ilgan", value: fmt(data?.payroll.reduce((s, p) => s + p.collectedRevenue, 0) || 0), color: "#7C3AED" },
              { label: "Jami o'qituvchiga", value: fmt(data?.payroll.reduce((s, p) => s + p.earned, 0) || 0), color: "#059669" },
              { label: "Jami avans", value: fmt(data?.payroll.reduce((s, p) => s + p.advances, 0) || 0), color: "#F97316" },
              { label: "Jami jarima", value: fmt(data?.payroll.reduce((s, p) => s + p.fines, 0) || 0), color: "#DC2626" },
            ].map(c => (
              <div key={c.label} className="card" style={{ borderTop: `3px solid ${c.color}`, padding: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>{c.label}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: c.color }}>{c.value} UZS</div>
              </div>
            ))}
          </div>

          {/* Teacher payroll table */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>O'qituvchilar</h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["O'qituvchi", "Ulush%", "Yig'ilgan", "Hisoblangan", "Avans", "Jarima", "Qo'lga oladi", ""].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.payroll.map((row, i) => (
                  <>
                    <tr key={row.teacher.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#1e293b" }}>{row.teacher.name}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#7C3AED", fontWeight: 700 }}>{row.teacher.sharePercent}%</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#475569" }}>{fmt(row.collectedRevenue)}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#059669", fontWeight: 700 }}>{fmt(row.earned)}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#F97316" }}>{fmt(row.advances)}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#DC2626" }}>{fmt(row.fines)}</td>
                      <td style={{ padding: "0.875rem 1rem", fontWeight: 800, color: row.finalSalary >= 0 ? "#059669" : "#DC2626" }}>{fmt(row.finalSalary)}</td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem" }}
                            onClick={() => setExpanded(expanded === row.teacher.id ? null : row.teacher.id)}>
                            {expanded === row.teacher.id ? "Yopish" : "Batafsil"}
                          </button>
                          <button className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem" }}
                            onClick={() => { setModal({ type: "advance", teacherId: row.teacher.id, teacherName: row.teacher.name }); }}>
                            + Avans
                          </button>
                          <button style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "0.375rem", fontSize: "0.75rem", padding: "0.25rem 0.75rem", cursor: "pointer" }}
                            onClick={() => { setModal({ type: "fine", teacherId: row.teacher.id, teacherName: row.teacher.name }); }}>
                            + Jarima
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded === row.teacher.id && (
                      <tr key={`${row.teacher.id}-detail`}>
                        <td colSpan={8} style={{ padding: "0.75rem 1.5rem 1rem", background: "#f8f7ff", borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            {/* Advances */}
                            <div>
                              <div style={{ fontWeight: 700, color: "#F97316", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Avanslar</div>
                              {row.advanceList.length === 0 ? <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Avans yo'q</div> : row.advanceList.map(a => (
                                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.375rem 0", borderBottom: "1px solid #e2e8f0", fontSize: "0.875rem" }}>
                                  <span style={{ color: "#475569" }}>{new Date(a.date).toLocaleDateString()} — {a.reason || "Avans"}</span>
                                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <span style={{ fontWeight: 700, color: "#F97316" }}>{fmt(a.amount)}</span>
                                    <button onClick={() => deleteEntry("advance", a.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem" }}>✕</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Fines */}
                            <div>
                              <div style={{ fontWeight: 700, color: "#DC2626", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Jarimalar</div>
                              {row.fineList.length === 0 ? <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Jarima yo'q</div> : row.fineList.map(f => (
                                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.375rem 0", borderBottom: "1px solid #e2e8f0", fontSize: "0.875rem" }}>
                                  <span style={{ color: "#475569" }}>{new Date(f.date).toLocaleDateString()} — {f.reason || "Jarima"}</span>
                                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <span style={{ fontWeight: 700, color: "#DC2626" }}>{fmt(f.amount)}</span>
                                    <button onClick={() => deleteEntry("fine", f.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem" }}>✕</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Staff section */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Xodimlar (o'qituvchi bo'lmaganlar)</h2>
              <button className="btn btn-primary" style={{ fontSize: "0.875rem" }} onClick={() => { setEditStaff(null); setStaffForm({ name: "", role: "secretary", monthlySalary: "", phone: "" }); setStaffModal(true); }}>
                + Xodim qo'shish
              </button>
            </div>
            {data?.staff.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>Xodim qo'shilmagan</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Ism", "Lavozim", "Telefon", "Oylik", ""].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.staff.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#1e293b" }}>{s.name}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#475569" }}>{s.role}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#475569" }}>{s.phone || "—"}</td>
                      <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#059669" }}>{fmt(s.monthlySalary)} UZS</td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem" }}
                            onClick={() => { setEditStaff(s); setStaffForm({ name: s.name, role: s.role, monthlySalary: String(s.monthlySalary), phone: s.phone || "" }); setStaffModal(true); }}>
                            Tahrirlash
                          </button>
                          <button style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "0.375rem", fontSize: "0.75rem", padding: "0.25rem 0.75rem", cursor: "pointer" }}
                            onClick={() => deleteStaff(s.id)}>
                            O'chirish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {/* Staff totals */}
            {data && data.staff.length > 0 && (
              <div style={{ padding: "0.75rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                Jami xodimlar maoshi: {fmt(data.staff.reduce((s, x) => s + x.monthlySalary, 0))} UZS
              </div>
            )}
          </div>
        </>
      )}

      {/* Advance/Fine Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="card" style={{ width: "400px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontWeight: 800 }}>
              {modal.type === "advance" ? "Avans qo'shish" : "Jarima qo'shish"} — {modal.teacherName}
            </h3>
            <div style={{ marginBottom: "0.75rem" }}>
              <label className="label">Summa (UZS)</label>
              <input className="input" type="number" placeholder="500000" value={modalForm.amount} onChange={e => setModalForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label className="label">Sababi</label>
              <input className="input" placeholder={modal.type === "advance" ? "Avans" : "20 minut kech keldi"} value={modalForm.reason} onChange={e => setModalForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Sana</label>
              <UzbekDatePicker dateOnly value={modalForm.date} onChange={v => setModalForm(f => ({ ...f, date: v }))} placeholder="Sana..." />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-primary" onClick={saveModal} disabled={saving || !modalForm.amount}>{saving ? "..." : "Saqlash"}</button>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Bekor</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {staffModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="card" style={{ width: "400px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontWeight: 800 }}>{editStaff ? "Xodimni tahrirlash" : "Yangi xodim"}</h3>
            <div style={{ marginBottom: "0.75rem" }}>
              <label className="label">Ism</label>
              <input className="input" placeholder="Shahnoza Opa" value={staffForm.name} onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label className="label">Lavozim</label>
              <input className="input" placeholder="secretary / admin / cleaner" value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label className="label">Oylik maosh (UZS)</label>
              <input className="input" type="number" placeholder="2000000" value={staffForm.monthlySalary} onChange={e => setStaffForm(f => ({ ...f, monthlySalary: e.target.value }))} />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Telefon</label>
              <input className="input" placeholder="+998 90 000 00 00" value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-primary" onClick={saveStaff} disabled={saving || !staffForm.name}>{saving ? "..." : "Saqlash"}</button>
              <button className="btn btn-secondary" onClick={() => setStaffModal(false)}>Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

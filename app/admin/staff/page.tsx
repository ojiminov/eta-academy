"use client";

import { useState, useEffect } from "react";

type StaffMember = { id: string; name: string; role: string; monthlySalary: number; phone?: string };

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n));

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: "", role: "secretary", monthlySalary: "", phone: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/staff");
    const d = await res.json();
    if (Array.isArray(d)) setStaff(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditItem(null);
    setForm({ name: "", role: "secretary", monthlySalary: "", phone: "" });
    setModal(true);
  }

  function openEdit(s: StaffMember) {
    setEditItem(s);
    setForm({ name: s.name, role: s.role, monthlySalary: String(s.monthlySalary), phone: s.phone || "" });
    setModal(true);
  }

  async function save() {
    setSaving(true);
    const body = { ...form, monthlySalary: Number(form.monthlySalary) };
    if (editItem) {
      await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editItem.id, ...body }),
      });
    } else {
      await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setModal(false);
    setEditItem(null);
    setSaving(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu xodimni o'chirasizmi?")) return;
    await fetch("/api/admin/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const totalSalary = staff.reduce((s, x) => s + x.monthlySalary, 0);

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e293b", margin: "0 0 0.25rem" }}>👥 Xodimlar</h1>
          <p style={{ color: "#64748b", margin: 0 }}>O'qituvchi bo'lmagan xodimlar ro'yxati</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Xodim qo'shish</button>
      </div>

      {/* Summary card */}
      {staff.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="card" style={{ borderTop: "3px solid #7C3AED", padding: "1rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>Jami xodimlar</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#7C3AED" }}>{staff.length} nafar</div>
          </div>
          <div className="card" style={{ borderTop: "3px solid #059669", padding: "1rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>Jami oylik xarajat</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669" }}>{fmt(totalSalary)} UZS</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Yuklanmoqda...</div>
        ) : staff.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Xodim qo'shilmagan</div>
            <div style={{ fontSize: "0.875rem" }}>Kotib, xodim va boshqa xodimlarni qo'shing</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Ism", "Lavozim", "Telefon", "Oylik maosh", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#1e293b" }}>{s.name}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ background: "#ede9fe", color: "#7C3AED", padding: "0.2rem 0.6rem", borderRadius: "1rem", fontSize: "0.8rem", fontWeight: 600 }}>
                      {s.role}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem", color: "#475569" }}>{s.phone || "—"}</td>
                  <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#059669" }}>{fmt(s.monthlySalary)} UZS</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem" }} onClick={() => openEdit(s)}>
                        Tahrirlash
                      </button>
                      <button
                        style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "0.375rem", fontSize: "0.75rem", padding: "0.25rem 0.75rem", cursor: "pointer" }}
                        onClick={() => remove(s.id)}
                      >
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="card" style={{ width: "420px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.1rem" }}>
              {editItem ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
            </h3>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="label">Ism Familya</label>
              <input className="input" placeholder="Shahnoza Yusupova" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="label">Lavozim</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="secretary">Kotib</option>
                <option value="admin">Admin</option>
                <option value="cleaner">Farrosh</option>
                <option value="security">Qo'riqchi</option>
                <option value="accountant">Buxgalter</option>
                <option value="marketing">Marketing</option>
                <option value="other">Boshqa</option>
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="label">Oylik maosh (UZS)</label>
              <input className="input" type="number" placeholder="2000000" value={form.monthlySalary} onChange={e => setForm(f => ({ ...f, monthlySalary: e.target.value }))} />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">Telefon raqam</label>
              <input className="input" placeholder="+998 90 000 00 00" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.name || !form.monthlySalary}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Bekor qilish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

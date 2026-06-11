"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function NewTeacherPage() {
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", phone: "", bio: "", sharePercent: "50",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || t("forms.required"));
        return;
      }
      router.push("/admin/teachers");
      router.refresh();
    } catch {
      setError(t("forms.required"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "640px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{t("teachers.newTeacher")}</h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("teachers.title")}</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "#fee2e2", color: "#dc2626", borderRadius: "0.5rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">{t("forms.firstName")} *</label>
              <input className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div>
              <label className="label">{t("forms.lastName")} *</label>
              <input className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">{t("common.email")} *</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">{t("forms.password")} *</label>
            <input className="input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={6} />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">{t("common.phone")}</label>
            <input className="input" placeholder="+998..." value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">{t("teachers.bio")}</label>
            <textarea className="input" rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">Daromad ulushi (%)</label>
            <input className="input" type="number" min="0" max="100" placeholder="50" value={form.sharePercent} onChange={(e) => set("sharePercent", e.target.value)} />
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0" }}>O'qituvchi yig'ilgan to'lovdan oladigan foiz (masalan: 50, 70, 73)</p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t("forms.saving") : t("forms.submit")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

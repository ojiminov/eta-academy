"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import UzbekDatePicker from "@/components/UzbekDatePicker";

const LEVELS = ["BEGINNER", "ELEMENTARY", "PRE_INTERMEDIATE", "INTERMEDIATE", "UPPER_INTERMEDIATE", "ADVANCED"];

export default function NewGroupPage() {
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState<{ id: string; user: { firstName: string; lastName: string } }[]>([]);
  const [form, setForm] = useState({
    name: "", teacherId: "", level: "BEGINNER", schedule: "",
    maxStudents: "12", startDate: "", monthlyFee: "",
  });

  useEffect(() => {
    fetch("/api/admin/teachers")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setTeachers(data))
      .catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || t("forms.required"));
        return;
      }
      router.push("/admin/groups");
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
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>{t("forms.createGroup")}</h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("groups.title")}</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "#fee2e2", color: "#dc2626", borderRadius: "0.5rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">{t("forms.groupName")} *</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">{t("groups.teacher")} *</label>
              <select className="input" value={form.teacherId} onChange={(e) => set("teacherId", e.target.value)} required>
                <option value="">{t("forms.selectTeacher")}</option>
                {teachers.map((tc) => (
                  <option key={tc.id} value={tc.id}>{tc.user.firstName} {tc.user.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("groups.level")} *</label>
              <select className="input" value={form.level} onChange={(e) => set("level", e.target.value)}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{t(`levels.${l}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">{t("groups.schedule")} *</label>
            <input className="input" placeholder={t("forms.scheduleHint")} value={form.schedule} onChange={(e) => set("schedule", e.target.value)} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">{t("groups.maxStudents")}</label>
              <input className="input" type="number" min="1" max="30" value={form.maxStudents} onChange={(e) => set("maxStudents", e.target.value)} />
            </div>
            <div>
              <label className="label">{t("groups.monthlyFee")} (UZS) *</label>
              <input className="input" type="number" placeholder="750000" value={form.monthlyFee} onChange={(e) => set("monthlyFee", e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">{t("groups.startDate")} *</label>
            <UzbekDatePicker dateOnly value={form.startDate} onChange={v => set("startDate", v)} placeholder="Boshlanish sanasi..." />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t("forms.saving") : t("forms.createGroup")}
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

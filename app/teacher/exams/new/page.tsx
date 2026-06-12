"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import UzbekDatePicker from "@/components/UzbekDatePicker";

type Group = { id: string; name: string };

export default function NewExamPage() {
  const t = useTranslations();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState({ title: "", description: "", scheduledAt: "", maxScore: "100", groupId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetch("/api/teacher/groups").then(r => r.json()).then(setGroups); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.scheduledAt || !form.groupId) { setError(t("common.requiredFields")); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, maxScore: Number(form.maxScore) }),
    });
    if (res.ok) { router.push("/teacher/exams"); }
    else { const d = await res.json(); setError(d.error || t("common.saveFailed")); setSaving(false); }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "560px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>🧪 {t("exams.scheduleExam")}</h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("exams.scheduleAndResults")}</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {error && <div style={{ padding: "0.75rem", background: "#fee2e2", borderRadius: "0.5rem", color: "#dc2626", fontSize: "0.875rem" }}>{error}</div>}

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.375rem" }}>{t("exams.examTitle")} *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" style={{ width: "100%" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.375rem" }}>{t("common.group")} *</label>
          <select value={form.groupId} onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))} className="input" style={{ width: "100%" }}>
            <option value="">{t("common.select")}...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.375rem" }}>{t("common.description")}</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input" rows={3} style={{ width: "100%", resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.375rem" }}>{t("exams.scheduledAt")} *</label>
            <UzbekDatePicker
              value={form.scheduledAt}
              onChange={v => setForm(p => ({ ...p, scheduledAt: v }))}
              placeholder={t("common.select") + "..."}
              includeTime
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.375rem" }}>{t("homework.maxScore")} ({t("homework.pts")})</label>
            <input type="number" min={1} value={form.maxScore} onChange={e => setForm(p => ({ ...p, maxScore: e.target.value }))} className="input" style={{ width: "100%" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
            {saving ? t("exams.scheduling") : t("exams.scheduleExam")}
          </button>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary">{t("common.cancel")}</button>
        </div>
      </form>
    </div>
  );
}

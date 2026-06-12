"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import FileUpload from "@/components/FileUpload";

type Group = { id: string; name: string };

export default function NewHomeworkPage() {
  const t = useTranslations();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", returnDate: "", maxScore: "100", groupId: "", fileUrl: "", fileName: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetch("/api/teacher/groups").then(r => r.json()).then(setGroups); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.dueDate || !form.groupId) { setError(t("common.requiredFields")); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...form, maxScore: Number(form.maxScore) }),
    });
    if (res.ok) { router.push("/teacher/homework"); }
    else { const d = await res.json(); setError(d.error || t("common.saveFailed")); setSaving(false); }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>📝 {t("homework.assignHomework")}</h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("homework.assignAndGrade")}</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {error && <div style={{ padding: "0.75rem", background: "#fee2e2", borderRadius: "0.5rem", color: "#dc2626", fontSize: "0.875rem" }}>{error}</div>}

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.375rem" }}>{t("homework.homeworkTitle")} *</label>
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
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.375rem" }}>{t("homework.dueDate")} *</label>
            <input type="datetime-local" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="input" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.375rem" }}>{t("homework.returnDate")}</label>
            <input type="datetime-local" value={form.returnDate} onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))} className="input" style={{ width: "100%" }} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.375rem" }}>{t("homework.maxScore")} ({t("homework.pts")})</label>
          <input type="number" min={1} value={form.maxScore} onChange={e => setForm(p => ({ ...p, maxScore: e.target.value }))} className="input" style={{ width: "100%" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>{t("common.attachment")}</label>
          <FileUpload bucket="homework" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.zip" label={t("common.uploadFile")} onUploaded={r => setForm(p => ({ ...p, fileUrl: r.url, fileName: r.name }))} />
          {form.fileName && <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#6366f1" }}>📎 {form.fileName}</div>}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
            {saving ? t("common.saving") : t("homework.assignHomework")}
          </button>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary">{t("common.cancel")}</button>
        </div>
      </form>
    </div>
  );
}

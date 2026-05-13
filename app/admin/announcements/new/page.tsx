"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", body: "", targetRole: "" });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, targetRole: form.targetRole || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to post announcement");
        return;
      }
      router.push("/admin/announcements");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "640px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>New Announcement</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Post a message to teachers, students, or everyone</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "#fee2e2", color: "#dc2626", borderRadius: "0.5rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Title *</label>
            <input className="input" placeholder="e.g. Holiday schedule update" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Message *</label>
            <textarea
              className="input"
              rows={5}
              placeholder="Write your announcement here..."
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              required
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">Audience</label>
            <select className="input" value={form.targetRole} onChange={(e) => set("targetRole", e.target.value)}>
              <option value="">👥 Everyone (teachers + students)</option>
              <option value="TEACHER">👨‍🏫 Teachers only</option>
              <option value="STUDENT">👨‍🎓 Students only</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Posting..." : "Post Announcement"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

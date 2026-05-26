"use client";

import { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";

type Group = { id: string; name: string; };
type Material = {
  id: string; title: string; description?: string;
  fileUrl: string; fileName: string; fileSize?: number; fileType?: string;
  createdAt: string;
  group?: { name: string } | null;
  teacher: { user: { firstName: string; lastName: string } };
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (["doc","docx"].includes(ext!)) return "📝";
  if (["xls","xlsx"].includes(ext!)) return "📊";
  if (["ppt","pptx"].includes(ext!)) return "📑";
  if (["jpg","jpeg","png","gif","webp"].includes(ext!)) return "🖼️";
  if (["mp4","mov","avi","mkv"].includes(ext!)) return "🎬";
  if (["mp3","wav","m4a"].includes(ext!)) return "🎵";
  if (["zip","rar","7z"].includes(ext!)) return "🗜️";
  return "📎";
}

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ groupId: "", title: "", description: "" });
  const [fileData, setFileData] = useState<{ url: string; name: string; size: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/materials").then(r => r.json()),
      fetch("/api/teacher/groups").then(r => r.json()),
    ]).then(([mats, grps]) => {
      setMaterials(mats);
      setGroups(grps);
    }).finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileData) { setError("Please upload a file first"); return; }
    setError("");
    setSaving(true);
    const res = await fetch("/api/teacher/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fileUrl: fileData.url, fileName: fileData.name, fileSize: fileData.size }),
    });
    if (res.ok) {
      const mat = await res.json();
      setMaterials(prev => [mat, ...prev]);
      setForm({ groupId: "", title: "", description: "" });
      setFileData(null);
      setShowForm(false);
    } else {
      const d = await res.json();
      setError(d.error || "Failed to upload material");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material?")) return;
    setDeleting(id);
    const res = await fetch(`/api/teacher/materials?id=${id}`, { method: "DELETE" });
    if (res.ok) setMaterials(prev => prev.filter(m => m.id !== id));
    setDeleting(null);
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>Course Materials</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>Upload files for your students to download</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? "✕ Cancel" : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Upload Material
            </>
          )}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div style={{ background: "white", border: "2px solid #e0e7ff", borderRadius: "0.875rem", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 1.25rem", color: "#4f46e5", fontSize: "0.9375rem", fontWeight: "700" }}>Upload New Material</h3>
          <form onSubmit={handleUpload}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="label">Title *</label>
                <input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Unit 3 Grammar Notes" />
              </div>
              <div>
                <label className="label">Group (optional)</label>
                <select className="input" value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>
                  <option value="">All students</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes about this file..." />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">File *</label>
              <FileUpload bucket="material" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4,.zip,.mp3" label="Upload course material" onUploaded={r => setFileData(r)} />
            </div>
            {error && <div style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.75rem" }}>⚠️ {error}</div>}
            <button type="submit" disabled={saving || !fileData} className="btn btn-primary" style={{ opacity: !fileData ? 0.6 : 1 }}>
              {saving ? "Uploading..." : "Save Material"}
            </button>
          </form>
        </div>
      )}

      {/* Materials list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading...</div>
      ) : materials.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", padding: "4rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>📚</div>
          <div style={{ fontWeight: "600", color: "#0f172a" }}>No materials uploaded yet</div>
          <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.25rem" }}>Click "Upload Material" to add your first resource</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {materials.map(m => (
            <div key={m.id} style={{
              background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem",
              padding: "1.125rem 1.375rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", gap: "1rem",
            }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "0.75rem", background: "var(--primary-light, #ede9fe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                {fileIcon(m.fileName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "#0f172a" }}>{m.title}</div>
                {m.description && <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.125rem" }}>{m.description}</div>}
                <div style={{ display: "flex", gap: "0.875rem", marginTop: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>📎 {m.fileName}</span>
                  {m.fileSize && <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{formatBytes(m.fileSize)}</span>}
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>📅 {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  {m.group ? (
                    <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: "9999px", background: "var(--primary-light, #ede9fe)", color: "#5b21b6", fontWeight: "600" }}>{m.group.name}</span>
                  ) : (
                    <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: "9999px", background: "#f0fdf4", color: "#16a34a", fontWeight: "600" }}>All students</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "0.375rem 0.875rem", background: "#dbeafe", color: "#1e40af", borderRadius: "0.375rem", fontSize: "0.78rem", fontWeight: "600", textDecoration: "none" }}>
                  View
                </a>
                <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id} style={{ padding: "0.375rem 0.875rem", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "0.375rem", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer" }}>
                  {deleting === m.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

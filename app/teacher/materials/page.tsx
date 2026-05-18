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
  const [form, setForm] = useState({ groupId:"", title:"", description:"" });
  const [fileData, setFileData] = useState<{ url:string; name:string; size:number } | null>(null);
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
      body: JSON.stringify({
        ...form,
        fileUrl: fileData.url,
        fileName: fileData.name,
        fileSize: fileData.size,
      }),
    });
    if (res.ok) {
      const mat = await res.json();
      setMaterials(prev => [mat, ...prev]);
      setForm({ groupId:"", title:"", description:"" });
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
    <div style={{ padding:"2rem", maxWidth:"800px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>📚 Course Materials</h1>
          <p style={{ color:"#64748b", margin:0 }}>Upload files for your students to download</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding:"0.625rem 1.25rem", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", border:"none", borderRadius:"0.625rem", fontWeight:"600", cursor:"pointer", fontSize:"0.875rem" }}
        >
          {showForm ? "✕ Cancel" : "+ Upload Material"}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div className="card" style={{ marginBottom:"1.5rem", border:"2px solid #e0e7ff" }}>
          <h3 style={{ margin:"0 0 1rem", color:"#4f46e5", fontSize:"1rem" }}>📤 Upload New Material</h3>
          <form onSubmit={handleUpload}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
              <div>
                <label className="label">Title *</label>
                <input className="input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Unit 3 Grammar Notes" />
              </div>
              <div>
                <label className="label">Group (optional)</label>
                <select className="input" value={form.groupId} onChange={e=>setForm({...form,groupId:e.target.value})}>
                  <option value="">All students</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:"1rem" }}>
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Optional notes about this file..." />
            </div>
            <div style={{ marginBottom:"1rem" }}>
              <label className="label">File *</label>
              <FileUpload
                bucket="material"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4,.zip,.mp3"
                label="Upload course material"
                onUploaded={r => setFileData(r)}
              />
            </div>
            {error && <div style={{ color:"#ef4444", fontSize:"0.8rem", marginBottom:"0.75rem" }}>⚠️ {error}</div>}
            <button type="submit" disabled={saving || !fileData} style={{ padding:"0.625rem 1.5rem", background:"linear-gradient(135deg,#10b981,#059669)", color:"white", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor: (saving||!fileData)?"not-allowed":"pointer", opacity: !fileData ? 0.6 : 1 }}>
              {saving ? "Uploading..." : "Save Material"}
            </button>
          </form>
        </div>
      )}

      {/* Materials list */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>Loading...</div>
      ) : materials.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>📚</div>
          <div style={{ fontWeight:"600", color:"#1e293b" }}>No materials uploaded yet</div>
          <div style={{ color:"#94a3b8", fontSize:"0.875rem", marginTop:"0.25rem" }}>Click "Upload Material" to add your first resource</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
          {materials.map(m => (
            <div key={m.id} className="card" style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
              <div style={{ width:48, height:48, borderRadius:12, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", flexShrink:0 }}>
                {fileIcon(m.fileName)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:"700", fontSize:"0.9rem", color:"#1e293b" }}>{m.title}</div>
                {m.description && <div style={{ fontSize:"0.8rem", color:"#64748b", marginTop:"0.125rem" }}>{m.description}</div>}
                <div style={{ display:"flex", gap:"1rem", marginTop:"0.375rem", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>📎 {m.fileName}</span>
                  {m.fileSize && <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>{formatBytes(m.fileSize)}</span>}
                  <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>📅 {new Date(m.createdAt).toLocaleDateString()}</span>
                  {m.group ? (
                    <span style={{ fontSize:"0.72rem", padding:"0.1rem 0.5rem", borderRadius:"9999px", background:"#ede9fe", color:"#6366f1", fontWeight:"600" }}>{m.group.name}</span>
                  ) : (
                    <span style={{ fontSize:"0.72rem", padding:"0.1rem 0.5rem", borderRadius:"9999px", background:"#f0fdf4", color:"#16a34a", fontWeight:"600" }}>All students</span>
                  )}
                </div>
              </div>
              <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
                <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" style={{ padding:"0.375rem 0.75rem", background:"#f0f9ff", color:"#0369a1", borderRadius:"0.375rem", fontSize:"0.78rem", fontWeight:"600", textDecoration:"none" }}>
                  View
                </a>
                <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id} style={{ padding:"0.375rem 0.75rem", background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:"0.375rem", fontSize:"0.78rem", fontWeight:"600", cursor:"pointer" }}>
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

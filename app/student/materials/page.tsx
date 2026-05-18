"use client";

import { useEffect, useState } from "react";

type Material = {
  id: string; title: string; description?: string;
  fileUrl: string; fileName: string; fileSize?: number;
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

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/student/materials").then(r => r.json()).then(setMaterials).finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.fileName.toLowerCase().includes(search.toLowerCase()) ||
    (m.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>📚 Course Materials</h1>
        <p style={{ color:"#64748b", margin:0 }}>Resources shared by your teachers</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom:"1.25rem" }}>
        <input
          className="input"
          style={{ maxWidth:360 }}
          placeholder="🔍 Search materials..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>📚</div>
          <div style={{ fontWeight:"600", color:"#1e293b" }}>
            {search ? "No materials match your search" : "No materials available yet"}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
          {filtered.map(m => (
            <a
              key={m.id}
              href={m.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration:"none" }}
            >
              <div className="card" style={{ display:"flex", alignItems:"center", gap:"1rem", cursor:"pointer", transition:"transform 0.1s", border:"1.5px solid transparent" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#c7d2fe")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
              >
                <div style={{ width:52, height:52, borderRadius:14, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.75rem", flexShrink:0 }}>
                  {fileIcon(m.fileName)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:"700", fontSize:"0.9rem", color:"#1e293b" }}>{m.title}</div>
                  {m.description && <div style={{ fontSize:"0.8rem", color:"#64748b", marginTop:"0.125rem" }}>{m.description}</div>}
                  <div style={{ display:"flex", gap:"0.875rem", marginTop:"0.375rem", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>
                      👩‍🏫 {m.teacher.user.firstName} {m.teacher.user.lastName}
                    </span>
                    {m.fileSize && <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>{formatBytes(m.fileSize)}</span>}
                    <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>📅 {new Date(m.createdAt).toLocaleDateString()}</span>
                    {m.group && (
                      <span style={{ fontSize:"0.72rem", padding:"0.1rem 0.5rem", borderRadius:"9999px", background:"#ede9fe", color:"var(--primary, #6366f1)", fontWeight:"600" }}>{m.group.name}</span>
                    )}
                  </div>
                </div>
                <div style={{ flexShrink:0 }}>
                  <div style={{ padding:"0.375rem 0.875rem", background:"var(--primary-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))", color:"white", borderRadius:"0.5rem", fontSize:"0.78rem", fontWeight:"700" }}>
                    ⬇️ Download
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";

interface UploadResult {
  url: string;
  name: string;
  size: number;
}

interface FileUploadProps {
  bucket: "homework" | "submission" | "material" | "student_doc";
  onUploaded: (result: UploadResult) => void;
  accept?: string;
  label?: string;
  existingUrl?: string;
  existingName?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext!)) return "📄";
  if (["doc","docx"].includes(ext!)) return "📝";
  if (["xls","xlsx"].includes(ext!)) return "📊";
  if (["ppt","pptx"].includes(ext!)) return "📑";
  if (["jpg","jpeg","png","gif","webp","heic"].includes(ext!)) return "🖼️";
  if (["mp4","mov","avi","mkv"].includes(ext!)) return "🎬";
  if (["mp3","wav","m4a"].includes(ext!)) return "🎵";
  if (["zip","rar","7z"].includes(ext!)) return "🗜️";
  return "📎";
}

export default function FileUpload({
  bucket, onUploaded, accept = "*/*", label = "Upload file",
  existingUrl, existingName,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<UploadResult | null>(
    existingUrl && existingName ? { url: existingUrl, name: existingName, size: 0 } : null
  );
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    setProgress(10);

    try {
      // Step 1: get signed upload URL from our API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket, fileName: file.name, contentType: file.type }),
      });
      const { signedUrl, publicUrl, error: apiErr } = await res.json();
      if (apiErr || !signedUrl) throw new Error(apiErr || "Upload failed");

      setProgress(30);

      // Step 2: PUT directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      setProgress(100);
      const result = { url: publicUrl, name: file.name, size: file.size };
      setUploaded(result);
      onUploaded(result);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {/* Drop zone */}
      {!uploaded && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2px dashed #c7d2fe", borderRadius: "0.75rem",
            padding: "1.5rem", textAlign: "center", cursor: "pointer",
            background: uploading ? "#f5f3ff" : "#fafafa",
            transition: "background 0.15s",
          }}
        >
          <input
            ref={inputRef} type="file" accept={accept} style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {uploading ? (
            <div>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
              <div style={{ fontSize: "0.85rem", color: "#6366f1", fontWeight: "600" }}>Uploading…</div>
              <div style={{ marginTop: "0.5rem", height: 6, background: "#e0e7ff", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "#6366f1", transition: "width 0.3s" }} />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "2rem", marginBottom: "0.375rem" }}>📎</div>
              <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6366f1" }}>{label}</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                Drag & drop or click to browse
              </div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded file chip */}
      {uploaded && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.75rem 1rem", borderRadius: "0.625rem",
          background: "#f0fdf4", border: "1.5px solid #86efac",
        }}>
          <span style={{ fontSize: "1.5rem" }}>{fileIcon(uploaded.name)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#166534", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {uploaded.name}
            </div>
            {uploaded.size > 0 && (
              <div style={{ fontSize: "0.75rem", color: "#4ade80" }}>{formatBytes(uploaded.size)}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <a href={uploaded.url} target="_blank" rel="noopener noreferrer" style={{
              padding: "0.25rem 0.625rem", borderRadius: "0.375rem",
              background: "#dcfce7", color: "#166534", fontSize: "0.75rem",
              fontWeight: "600", textDecoration: "none",
            }}>View</a>
            <button onClick={() => { setUploaded(null); setProgress(0); }} style={{
              padding: "0.25rem 0.625rem", borderRadius: "0.375rem",
              background: "#fee2e2", color: "#991b1b", fontSize: "0.75rem",
              fontWeight: "600", border: "none", cursor: "pointer",
            }}>Remove</button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "0.5rem", color: "#ef4444", fontSize: "0.8rem" }}>⚠️ {error}</div>
      )}
    </div>
  );
}

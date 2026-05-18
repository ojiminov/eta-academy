"use client";

import { useEffect, useState, useRef } from "react";
import FileUpload from "@/components/FileUpload";

type Settings = {
  name: string;
  logoUrl: string | null;
  logoName: string | null;
  primaryColor: string;
};

const PRESETS = [
  { label: "Indigo",    color: "var(--primary, #6366f1)" },
  { label: "Blue",      color: "#3b82f6" },
  { label: "Emerald",   color: "#10b981" },
  { label: "Rose",      color: "#f43f5e" },
  { label: "Amber",     color: "#f59e0b" },
  { label: "Violet",    color: "#8b5cf6" },
  { label: "Sky",       color: "#0ea5e9" },
  { label: "Teal",      color: "#14b8a6" },
  { label: "Orange",    color: "#f97316" },
  { label: "Slate",     color: "#475569" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    name: "ETA Academy",
    logoUrl: null,
    logoName: null,
    primaryColor: "var(--primary, #6366f1)",
  });
  const [newLogo, setNewLogo] = useState<{ url: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => setSettings({ name: d.name ?? "ETA Academy", logoUrl: d.logoUrl, logoName: d.logoName, primaryColor: d.primaryColor ?? "var(--primary, #6366f1)" }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const body: Partial<Settings> = { name: settings.name, primaryColor: settings.primaryColor };
    if (newLogo) {
      body.logoUrl  = newLogo.url;
      body.logoName = newLogo.name;
    }
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setSettings(s => ({ ...s, logoUrl: updated.logoUrl, logoName: updated.logoName }));
      setNewLogo(null);
      setSaved(true);
      // Apply new primary color immediately to the page (full reload bakes it in)
      setTimeout(() => window.location.reload(), 800);
    }
    setSaving(false);
  }

  const currentLogo = newLogo?.url ?? settings.logoUrl;
  const currentLogoName = newLogo?.name ?? settings.logoName;

  if (loading) return <div style={{ padding:"2rem", color:"#94a3b8" }}>Loading...</div>;

  return (
    <div style={{ padding:"2rem", maxWidth:"680px" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>🎨 Academy Branding</h1>
        <p style={{ color:"#64748b", margin:0 }}>Customise the name, logo, and colour theme of your academy</p>
      </div>

      {/* Academy Name */}
      <div className="card" style={{ marginBottom:"1.25rem" }}>
        <h3 style={{ margin:"0 0 1rem", color:"#1e293b", fontSize:"1rem", fontWeight:"700" }}>🏫 Academy Name</h3>
        <input
          className="input"
          value={settings.name}
          onChange={e => setSettings(s => ({ ...s, name: e.target.value }))}
          placeholder="e.g. British Academy Tashkent"
          style={{ fontSize:"1rem" }}
        />
        <p style={{ color:"#94a3b8", fontSize:"0.78rem", margin:"0.5rem 0 0" }}>
          Shown in the sidebar, mobile top bar, and login page.
        </p>
      </div>

      {/* Logo */}
      <div className="card" style={{ marginBottom:"1.25rem" }}>
        <h3 style={{ margin:"0 0 1rem", color:"#1e293b", fontSize:"1rem", fontWeight:"700" }}>🖼️ Academy Logo</h3>

        {currentLogo && (
          <div style={{ marginBottom:"1rem", display:"flex", alignItems:"center", gap:"1rem", padding:"0.875rem", background:"#f8fafc", borderRadius:"0.75rem", border:"1px solid #e2e8f0" }}>
            <img
              src={currentLogo}
              alt="Academy logo"
              style={{ width:64, height:64, objectFit:"contain", borderRadius:"0.5rem", background:"white", border:"1px solid #e2e8f0" }}
            />
            <div>
              <div style={{ fontWeight:"600", fontSize:"0.875rem", color:"#1e293b" }}>Current logo</div>
              {currentLogoName && <div style={{ fontSize:"0.75rem", color:"#94a3b8", marginTop:"0.125rem" }}>{currentLogoName}</div>}
              {newLogo && <div style={{ fontSize:"0.72rem", color:"#10b981", fontWeight:"600", marginTop:"0.25rem" }}>✓ New logo ready to save</div>}
            </div>
          </div>
        )}

        <FileUpload
          bucket="branding"
          accept=".png,.jpg,.jpeg,.svg,.webp"
          label={currentLogo ? "Upload a different logo" : "Upload your academy logo"}
          onUploaded={r => setNewLogo({ url: r.url, name: r.name })}
        />
        <p style={{ color:"#94a3b8", fontSize:"0.78rem", margin:"0.75rem 0 0" }}>
          PNG or SVG with transparent background works best. Recommended: 256×256 px or larger.
        </p>
      </div>

      {/* Primary Color */}
      <div className="card" style={{ marginBottom:"1.5rem" }}>
        <h3 style={{ margin:"0 0 0.25rem", color:"#1e293b", fontSize:"1rem", fontWeight:"700" }}>🎨 Primary Colour</h3>
        <p style={{ color:"#64748b", fontSize:"0.82rem", margin:"0 0 1rem" }}>
          Used for buttons, active menu items, and key accents throughout the app.
        </p>

        {/* Preset swatches */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.625rem", marginBottom:"1rem" }}>
          {PRESETS.map(p => (
            <button
              key={p.color}
              onClick={() => setSettings(s => ({ ...s, primaryColor: p.color }))}
              title={p.label}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: p.color, border: "none", cursor: "pointer",
                outline: settings.primaryColor === p.color ? `3px solid ${p.color}` : "3px solid transparent",
                outlineOffset: 2,
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                transition: "transform 0.1s",
                transform: settings.primaryColor === p.color ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* Custom color picker */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <label style={{ fontSize:"0.82rem", color:"#64748b", fontWeight:"500" }}>Custom:</label>
          <input
            type="color"
            value={settings.primaryColor}
            onChange={e => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
            style={{ width:44, height:36, borderRadius:"0.5rem", border:"1px solid #e2e8f0", cursor:"pointer", padding:"2px" }}
          />
          <span style={{ fontSize:"0.82rem", fontFamily:"monospace", color:"#475569", fontWeight:"600" }}>{settings.primaryColor}</span>
        </div>

        {/* Live preview */}
        <div style={{ marginTop:"1.25rem", padding:"1rem", background:"#f8fafc", borderRadius:"0.75rem", border:"1px solid #e2e8f0" }}>
          <div style={{ fontSize:"0.75rem", color:"#94a3b8", marginBottom:"0.75rem", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.05em" }}>Preview</div>
          <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", alignItems:"center" }}>
            <button style={{ padding:"0.5rem 1.25rem", background:settings.primaryColor, color:"white", border:"none", borderRadius:"0.5rem", fontWeight:"700", fontSize:"0.875rem", cursor:"pointer" }}>
              Save Changes
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.5rem 0.875rem", background:`${settings.primaryColor}22`, borderRadius:"0.5rem", borderLeft:`3px solid ${settings.primaryColor}` }}>
              <span>🏠</span>
              <span style={{ fontWeight:"700", fontSize:"0.875rem", color:settings.primaryColor }}>Dashboard</span>
            </div>
            <div style={{ width:12, height:12, borderRadius:"50%", background:settings.primaryColor }} />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding:"0.75rem 2rem",
            background: saving ? "#94a3b8" : settings.primaryColor,
            color:"white", border:"none", borderRadius:"0.625rem",
            fontWeight:"700", fontSize:"0.9rem",
            cursor: saving ? "not-allowed" : "pointer",
            transition:"background 0.2s",
          }}
        >
          {saving ? "Saving..." : "💾 Save Branding"}
        </button>
        {saved && (
          <div style={{ color:"#10b981", fontWeight:"600", fontSize:"0.875rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
            ✅ Saved! Reloading…
          </div>
        )}
      </div>
    </div>
  );
}

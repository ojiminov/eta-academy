"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  englishLevel: string;
  user: { firstName: string; lastName: string; email: string; phone?: string | null; isActive: boolean };
  groupStudents: { id: string; group: { name: string } }[];
};

const AVATAR_COLORS = ["#6366f1","#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner", ELEMENTARY: "Elementary",
  PRE_INTERMEDIATE: "Pre-Int", INTERMEDIATE: "Intermediate",
  UPPER_INTERMEDIATE: "Upper-Int", ADVANCED: "Advanced",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/students")
      .then(r => r.json())
      .then(data => { setStudents(Array.isArray(data) ? data : data.students || []); })
      .finally(() => setLoading(false));
  }, []);

  const q = search.toLowerCase().trim();
  const filtered = q
    ? students.filter(s => {
        const name = `${s.user.firstName} ${s.user.lastName}`.toLowerCase();
        const groups = s.groupStudents.map(g => g.group.name.toLowerCase()).join(" ");
        return (
          name.includes(q) ||
          s.user.email.toLowerCase().includes(q) ||
          (s.user.phone || "").includes(q) ||
          groups.includes(q) ||
          LEVEL_LABELS[s.englishLevel]?.toLowerCase().includes(q)
        );
      })
    : students;

  const activeCount = students.filter(s => s.user.isActive).length;

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.25rem" }}>
            Students
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
            {students.length} enrolled &middot; {activeCount} active
            {q && ` · ${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${search}"`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* Search input */}
          <div style={{ position: "relative" }}>
            <i className="ti ti-search" style={{
              position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)",
              color: "#94a3b8", fontSize: "0.95rem", pointerEvents: "none",
            }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone…"
              style={{
                paddingLeft: "2.25rem", paddingRight: search ? "2.25rem" : "0.875rem",
                paddingTop: "0.5625rem", paddingBottom: "0.5625rem",
                border: "1.5px solid #e2e8f0", borderRadius: "0.625rem",
                fontSize: "0.875rem", fontFamily: "inherit",
                background: "white", color: "#0f172a",
                outline: "none", width: "260px",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--primary, #2a5c45)"; e.target.style.boxShadow = "0 0 0 3px rgba(42,92,69,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "#94a3b8", fontSize: "0.9rem", padding: "0", lineHeight: 1,
              }}>
                <i className="ti ti-x" />
              </button>
            )}
          </div>
          <Link href="/admin/students/new" className="btn btn-primary" style={{ gap: "0.375rem", whiteSpace: "nowrap" }}>
            <i className="ti ti-plus" style={{ fontSize: "1rem" }} />
            + Yangi o&apos;quvchi
          </Link>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Student", "Daraja", "Guruhlar", "Telefon", "Holat", "Amallar"].map((h, i) => (
                  <th key={h} style={{
                    padding: "0.75rem " + (i === 0 || i === 5 ? "1.25rem" : "1rem"),
                    textAlign: i === 5 ? "right" : "left",
                    fontSize: "0.72rem", fontWeight: "600", color: "#64748b",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "4rem", textAlign: "center" }}>
                    <i className="ti ti-search-off" style={{ fontSize: "2rem", color: "#94a3b8", display: "block", marginBottom: "0.75rem" }} />
                    <div style={{ fontWeight: "500", color: "#475569", marginBottom: "0.375rem" }}>
                      {q ? `No students found for "${search}"` : "No students yet"}
                    </div>
                    {q && (
                      <button onClick={() => setSearch("")} style={{ color: "var(--primary, #2a5c45)", fontSize: "0.875rem", fontWeight: "500", background: "none", border: "none", cursor: "pointer" }}>
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => {
                  const name = `${s.user.firstName} ${s.user.lastName}`;
                  const color = avatarColor(name);
                  return (
                    <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background 0.1s" }}
                      onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseOut={e => (e.currentTarget.style.background = "")}>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{
                            width: "36px", height: "36px", borderRadius: "50%",
                            background: color, display: "flex", alignItems: "center",
                            justifyContent: "center", color: "white", fontSize: "0.75rem",
                            fontWeight: "700", flexShrink: 0,
                          }}>
                            {`${s.user.firstName.charAt(0)}${s.user.lastName.charAt(0)}`.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>{name}</div>
                            <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{s.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span style={{ display: "inline-flex", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: "600", background: "var(--primary-light, #d4ede1)", color: "var(--primary, #2a5c45)" }}>
                          {LEVEL_LABELS[s.englishLevel] || s.englishLevel}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        {s.groupStudents.length === 0 ? (
                          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>—</span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            {s.groupStudents.map(gs => (
                              <span key={gs.id} style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "500" }}>{gs.group.name}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#475569" }}>
                        {s.user.phone || <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: "600",
                          ...(s.user.isActive
                            ? { background: "#dcfce7", color: "#16a34a" }
                            : { background: "#f1f5f9", color: "#64748b" }),
                        }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.user.isActive ? "#16a34a" : "#94a3b8", flexShrink: 0 }} />
                          {s.user.isActive ? "Faol" : "Nofaol"}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                        <Link href={`/admin/students/${s.id}`} style={{
                          fontSize: "0.8rem", fontWeight: "500", color: "var(--primary, #2a5c45)",
                          textDecoration: "none", padding: "0.375rem 0.75rem",
                          border: "1px solid var(--primary-light, #d4ede1)", borderRadius: "0.4rem",
                          background: "var(--primary-light, #d4ede1)", display: "inline-block",
                        }}>
                          Ko&apos;rish
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to create student");
        return;
      }

      router.push("/admin/students");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>
          Add New Student
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>Create a student account</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">First Name *</label>
              <input name="firstName" className="input" required />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input name="lastName" className="input" required />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Email *</label>
            <input name="email" type="email" className="input" required />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Password *</label>
            <input name="password" type="password" className="input" required minLength={6} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" placeholder="+998..." />
            </div>
            <div>
              <label className="label">English Level</label>
              <select name="englishLevel" className="input">
                {["BEGINNER","ELEMENTARY","PRE_INTERMEDIATE","INTERMEDIATE","UPPER_INTERMEDIATE","ADVANCED"].map((l) => (
                  <option key={l} value={l}>{l.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label className="label">Parent Name</label>
              <input name="parentName" className="input" />
            </div>
            <div>
              <label className="label">Parent Phone</label>
              <input name="parentPhone" className="input" placeholder="+998..." />
            </div>
          </div>

          {error && (
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Creating..." : "Create Student"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function NewStudentPage() {
  const router = useRouter();
  const t = useTranslations();
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
        setError(json.error || t("forms.required"));
        return;
      }

      router.push("/admin/students");
    } catch {
      setError(t("forms.required"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>
          {t("students.newStudent")}
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>{t("forms.firstName")} & {t("forms.lastName")}</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">{t("forms.firstName")} *</label>
              <input name="firstName" className="input" required />
            </div>
            <div>
              <label className="label">{t("forms.lastName")} *</label>
              <input name="lastName" className="input" required />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">{t("common.email")} *</label>
            <input name="email" type="email" className="input" required />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">{t("forms.password")} *</label>
            <input name="password" type="password" className="input" required minLength={6} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">{t("common.phone")}</label>
              <input name="phone" className="input" placeholder="+998..." />
            </div>
            <div>
              <label className="label">{t("students.level")}</label>
              <select name="englishLevel" className="input">
                {["BEGINNER","ELEMENTARY","PRE_INTERMEDIATE","INTERMEDIATE","UPPER_INTERMEDIATE","ADVANCED"].map((l) => (
                  <option key={l} value={l}>{t(`levels.${l}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label className="label">{t("students.parentName")}</label>
              <input name="parentName" className="input" />
            </div>
            <div>
              <label className="label">{t("students.parentPhone")}</label>
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
              {loading ? t("common.loading") : t("forms.submit")}
            </button>
            <button type="button" onClick={() => router.back()} className="btn btn-secondary">
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

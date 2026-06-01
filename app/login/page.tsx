"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("invalidCredentials")); return; }
      if (data.role === "ADMIN") router.push("/admin");
      else if (data.role === "TEACHER") router.push("/teacher");
      else if (data.role === "STUDENT") router.push("/student");
      else if (data.role === "PARENT") router.push("/parent");
      else router.push("/");
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-story">
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div className="eta-brand-mark" style={{ background: "var(--primary)", borderColor: "var(--primary)", color: "white" }}>ETA</div>
          <div>
            <div style={{ fontWeight: 900, color: "var(--text)", fontSize: "1.05rem" }}>ETA Academy</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Learning portal</div>
          </div>
        </div>

        <div style={{ maxWidth: "760px" }}>
          <p style={{ color: "var(--primary)", fontWeight: 800, margin: "0 0 0.75rem", textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.08em" }}>
            English Teaching Academy
          </p>
          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", lineHeight: 1.02, margin: 0, maxWidth: "760px", fontWeight: 900 }}>
            One calm workspace for classes, progress, and payments.
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "560px", margin: "1.25rem 0 0" }}>
            Admins, teachers, students, and parents get a focused view of the day without digging through messages or spreadsheets.
          </p>
        </div>

        <div className="login-feature-grid">
          {[
            ["Live groups", "Schedules, attendance, and class ownership in one place."],
            ["Student progress", "Grades, homework, coins, and streaks stay visible."],
            ["Clear finance", "Payments and debtors are easy to scan and act on."],
          ].map(([title, body]) => (
            <div key={title} style={{ background: "rgba(255,255,255,0.72)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontWeight: 800, color: "var(--text)", marginBottom: "0.25rem" }}>{title}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.5 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="login-panel">
        <div style={{ position: "fixed", top: "1rem", right: "1rem" }}>
          <div style={{
            background: "white", borderRadius: "0.5rem", padding: "4px",
            display: "flex", gap: "2px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
          }}>
            {(["uz","en","ru"] as const).map((code) => {
              const labels = { uz: "O'z", en: "EN", ru: "RU" };
              return (
                <button
                  key={code}
                  onClick={async () => {
                    await fetch("/api/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: code }) });
                    router.refresh();
                  }}
                  style={{
                    padding: "5px 10px", border: "none", borderRadius: "0.375rem", cursor: "pointer",
                    fontSize: "0.75rem", fontWeight: "800",
                    background: "transparent", color: "var(--text-muted)",
                  }}
                >
                  {labels[code]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="login-card">
          <div style={{ marginBottom: "2rem" }}>
            <div className="eta-brand-mark" style={{
              background: "var(--primary-light)",
              color: "var(--primary-dark)",
              borderColor: "var(--border)",
              marginBottom: "1rem",
            }}>ETA</div>
            <h1 style={{ fontSize: "1.65rem", fontWeight: "900", color: "var(--text)", margin: "0 0 0.35rem" }}>
              {t("title")}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.925rem", margin: 0 }}>{t("subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">{t("email")}</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} required />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">{t("password")}</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && (
              <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem", marginBottom: "1rem", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", minHeight: "46px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.72 : 1 }}>
              {loading ? "..." : t("signIn")}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

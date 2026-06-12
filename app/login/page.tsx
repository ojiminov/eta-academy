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
      if (data.role === "ADMIN")   router.push("/admin");
      else if (data.role === "TEACHER") router.push("/teacher");
      else if (data.role === "STUDENT") router.push("/student");
      else if (data.role === "PARENT")  router.push("/parent");
      else router.push("/");
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">

      {/* Language switcher — top right */}
      <div style={{ position: "fixed", top: "1.25rem", right: "1.25rem", zIndex: 10 }}>
        <div style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "0.5rem",
          padding: "4px",
          display: "flex",
          gap: "2px",
          border: "1px solid rgba(255,255,255,0.15)",
        }}>
          {(["uz", "en", "ru"] as const).map((code) => {
            const labels = { uz: "O'z", en: "EN", ru: "RU" };
            return (
              <button
                key={code}
                onClick={async () => {
                  await fetch("/api/locale", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ locale: code }),
                  });
                  window.location.href = window.location.pathname;
                }}
                style={{
                  padding: "5px 10px",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {labels[code]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Centered card */}
      <div className="login-card">
        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "2rem" }}>
          <div className="eta-brand-mark" style={{ marginBottom: "1rem" }}>ETA</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text)", margin: "0 0 0.35rem" }}>
            {t("title")}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
            {t("subtitle")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label className="label">{t("email")}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              required
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">{t("password")}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              marginBottom: "1rem",
              border: "1px solid #fecaca",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", minHeight: "46px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.72 : 1 }}
          >
            {loading ? "..." : t("signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}

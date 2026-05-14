"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
      else router.push("/");
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", padding: "1rem",
    }}>
      {/* Language switcher top-right */}
      <div style={{ position: "fixed", top: "1rem", right: "1rem" }}>
        <div style={{
          background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "4px",
          display: "flex", gap: "2px",
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
                  padding: "5px 10px", border: "none", borderRadius: "7px", cursor: "pointer",
                  fontSize: "0.75rem", fontWeight: "700",
                  background: "transparent", color: "rgba(255,255,255,0.85)",
                }}
              >
                {labels[code]}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        background: "white", borderRadius: "1rem", padding: "2.5rem",
        width: "100%", maxWidth: "400px", boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "56px", height: "56px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", fontSize: "1.5rem",
          }}>🎓</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>
            {t("title")}
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>{t("subtitle")}</p>
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
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "0.75rem",
            background: loading ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white", border: "none", borderRadius: "0.5rem",
            fontSize: "1rem", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "..." : t("signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useLocale } from "next-intl";
import { useState } from "react";

const LANGUAGES = [
  { code: "uz", label: "O'z", full: "O'zbek" },
  { code: "en", label: "EN", full: "English" },
  { code: "ru", label: "RU", full: "Русский" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  async function switchLocale(code: string) {
    if (code === locale || loading) return;
    setLoading(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: code }),
    });
    window.location.reload();
  }

  return (
    <div style={{
      display: "flex",
      gap: "2px",
      background: "rgba(255,255,255,0.08)",
      borderRadius: "8px",
      padding: "3px",
    }}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLocale(lang.code)}
          title={lang.full}
          disabled={loading}
          style={{
            padding: "4px 8px",
            borderRadius: "6px",
            border: "none",
            cursor: loading ? "default" : "pointer",
            fontSize: "0.7rem",
            fontWeight: "700",
            letterSpacing: "0.03em",
            transition: "all 0.15s",
            background: locale === lang.code ? "var(--primary, rgba(99,102,241,0.8))" : "transparent",
            color: locale === lang.code ? "white" : "rgba(255,255,255,0.5)",
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

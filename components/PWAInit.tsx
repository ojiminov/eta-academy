"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInit() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 5 seconds of using the app, only once per session
      if (!sessionStorage.getItem("pwa-banner-shown")) {
        setTimeout(() => setShowBanner(true), 5000);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setInstallPrompt(null);
    }
    sessionStorage.setItem("pwa-banner-shown", "1");
  }

  function dismiss() {
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-shown", "1");
  }

  if (!showBanner || !installPrompt) return null;

  return (
    <div style={{
      position: "fixed", bottom: "1rem", left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 2rem)", maxWidth: "420px",
      background: "white", borderRadius: "1rem", padding: "1rem 1.25rem",
      boxShadow: "0 8px 32px rgba(99,102,241,0.18)", border: "1.5px solid #e0e7ff",
      display: "flex", alignItems: "center", gap: "0.875rem", zIndex: 9999,
    }}>
      <div style={{ fontSize: "2rem" }}>📲</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.9rem" }}>Install ETA Academy</div>
        <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Add to your home screen for faster access</div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={dismiss} style={{ padding: "0.375rem 0.75rem", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "0.5rem", fontWeight: "600", fontSize: "0.8rem", cursor: "pointer" }}>
          Later
        </button>
        <button onClick={handleInstall} style={{ padding: "0.375rem 0.875rem", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" }}>
          Install
        </button>
      </div>
    </div>
  );
}

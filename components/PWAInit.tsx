"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "";

export default function PWAInit() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // ── Service worker ───────────────────────────────────
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // ── OneSignal push notifications ─────────────────────
    if (ONESIGNAL_APP_ID) {
      initOneSignal();
    }

    // ── PWA install prompt ───────────────────────────────
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (!sessionStorage.getItem("pwa-banner-shown")) {
        setTimeout(() => setShowBanner(true), 6000);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function initOneSignal() {
    try {
      // Dynamically load OneSignal SDK (avoids SSR issues)
      await loadScript("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js");

      const OneSignal = (window as any).OneSignal || [];
      (window as any).OneSignal = OneSignal;

      OneSignal.push(async () => {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: "", // fill in if you use Safari push certs
          notifyButton: { enable: false }, // we use our own UI
          allowLocalhostAsSecureOrigin: true,
          promptOptions: {
            slidedown: {
              prompts: [{
                type: "push",
                autoPrompt: false, // we'll prompt manually after login
                text: {
                  actionMessage: "ETA Academy wants to send you class updates, homework reminders, and payment alerts.",
                  acceptButton: "Allow",
                  cancelButton: "No thanks",
                },
              }],
            },
          },
        });

        // After init, link the OneSignal player ID to our user account
        const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
        if (isSubscribed) {
          await registerPlayerWithServer();
        } else {
          // Show prompt once, 3 seconds after page load
          setTimeout(async () => {
            if (!localStorage.getItem("push-prompted")) {
              localStorage.setItem("push-prompted", "1");
              await OneSignal.Slidedown.promptPush();
              // After user decides, register if they accepted
              OneSignal.User.PushSubscription.addEventListener("change", async () => {
                const opted = await OneSignal.User.PushSubscription.optedIn;
                if (opted) await registerPlayerWithServer();
              });
            }
          }, 3000);
        }
      });
    } catch {
      // OneSignal is non-critical — silently ignore errors
    }
  }

  async function registerPlayerWithServer() {
    try {
      const OneSignal = (window as any).OneSignal;
      const playerId = await OneSignal.User.PushSubscription.id;
      if (!playerId) return;
      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    } catch {
      // non-critical
    }
  }

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
      position: "fixed", bottom: "5rem", left: "50%", transform: "translateX(-50%)",
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

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

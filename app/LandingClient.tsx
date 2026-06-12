"use client";

import { useState } from "react";
import Link from "next/link";

type Lang = "uz" | "en" | "ru";

const T = {
  uz: {
    heroTitle: "Ingliz tilini professional darajada o'rganing",
    heroSub:   "Zamonaviy o'quv markazi — dars jadvali, baholar va to'lovlarni online portal orqali kuzating.",
    signIn:    "Kirish",
    featuresTitle: "Platforma imkoniyatlari",
    features: [
      { icon: "🎓", title: "O'quvchi portali",   desc: "Dars jadvali, uyga vazifalar, imtihonlar, baholar va davomatni bir joyda kuzating." },
      { icon: "👨‍👩‍👧", title: "Ota-ona portali",  desc: "Farzandingizning darslarini, to'lovlarini va rivojlanishini real vaqtda kuzating." },
      { icon: "📚", title: "O'qituvchi vositalari", desc: "Davomat, baholar, uyga vazifalar va materiallarni qulay boshqaring." },
    ],
    contactTitle: "Bog'lanish / Kirish so'rovi",
    contactDesc:  "Farzandingizni ro'yxatdan o'tkazish yoki biz bilan bog'lanish uchun quyidagilardan foydalaning.",
    telegram:     "Telegram orqali yozing",
    email:        "Email yuborish",
    noContact:    "Bog'lanish ma'lumotlari tez orada qo'shiladi.",
    footer:       "Barcha huquqlar himoyalangan.",
  },
  en: {
    heroTitle: "Learn English at a Professional Level",
    heroSub:   "A modern English learning center — track schedules, grades, and payments through our online portal.",
    signIn:    "Sign In",
    featuresTitle: "Platform Features",
    features: [
      { icon: "🎓", title: "Student Portal",   desc: "View your timetable, homework, exams, grades, and attendance all in one place." },
      { icon: "👨‍👩‍👧", title: "Parent Portal",  desc: "Monitor your child's lessons, payments, and progress in real time." },
      { icon: "📚", title: "Teacher Tools",    desc: "Manage attendance, grades, homework, and course materials with ease." },
    ],
    contactTitle: "Contact Us / Request Access",
    contactDesc:  "To enroll your child or get in touch with us, reach out through any of the channels below.",
    telegram:     "Message us on Telegram",
    email:        "Send us an email",
    noContact:    "Contact details coming soon.",
    footer:       "All rights reserved.",
  },
  ru: {
    heroTitle: "Учите английский на профессиональном уровне",
    heroSub:   "Современный языковой центр — расписание, оценки и платежи в одном онлайн-портале.",
    signIn:    "Войти",
    featuresTitle: "Возможности платформы",
    features: [
      { icon: "🎓", title: "Портал ученика",          desc: "Расписание, задания, экзамены, оценки и посещаемость — всё в одном месте." },
      { icon: "👨‍👩‍👧", title: "Портал для родителей", desc: "Следите за занятиями, платежами и успехами ребёнка в реальном времени." },
      { icon: "📚", title: "Инструменты учителя",     desc: "Управляйте посещаемостью, оценками, заданиями и материалами курса." },
    ],
    contactTitle: "Связаться / Запрос доступа",
    contactDesc:  "Для записи ребёнка или связи с нами воспользуйтесь любым из каналов ниже.",
    telegram:     "Написать в Telegram",
    email:        "Написать на почту",
    noContact:    "Контактная информация скоро будет добавлена.",
    footer:       "Все права защищены.",
  },
};

interface Props {
  academyName: string;
  logoUrl: string | null;
  telegramUrl: string | null;
  contactEmail: string | null;
}

export default function LandingClient({ academyName, logoUrl, telegramUrl, contactEmail }: Props) {
  const [lang, setLang] = useState<Lang>("uz");
  const t = T[lang];
  const hasContact = telegramUrl || contactEmail;

  return (
    <div style={{ fontFamily: "var(--font-jakarta, system-ui, sans-serif)", minHeight: "100vh", background: "#f8fafc" }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(30,61,45,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.5rem", height: "60px",
      }}>
        {/* Logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {logoUrl ? (
            <img src={logoUrl} alt={academyName} style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6, mixBlendMode: "screen" }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 900, color: "white" }}>ETA</div>
          )}
          <span style={{ color: "white", fontWeight: 800, fontSize: "1rem", letterSpacing: 0 }}>{academyName}</span>
        </div>

        {/* Right: lang switcher + sign in */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Language switcher */}
          <div style={{ display: "flex", gap: "2px", background: "rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "3px" }}>
            {(["uz","en","ru"] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: "0.2rem 0.55rem", borderRadius: "0.35rem", border: "none", cursor: "pointer",
                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase",
                background: lang === l ? "rgba(255,255,255,0.92)" : "transparent",
                color: lang === l ? "#1e3d2d" : "rgba(255,255,255,0.6)",
                transition: "all 0.15s",
              }}>
                {l === "uz" ? "O'z" : l === "en" ? "EN" : "RU"}
              </button>
            ))}
          </div>
          <Link href="/login" style={{
            padding: "0.4rem 1.1rem", borderRadius: "0.5rem",
            background: "#34d399", color: "#064e3b",
            fontWeight: 700, fontSize: "0.82rem", textDecoration: "none",
            transition: "background 0.15s",
          }}>
            {t.signIn} →
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(160deg, #1e3d2d 0%, #2a5c45 60%, #1a3326 100%)",
        paddingTop: "calc(60px + 5rem)", paddingBottom: "5rem",
        paddingLeft: "1.5rem", paddingRight: "1.5rem",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(52,211,153,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(52,211,153,0.04)", pointerEvents: "none" }} />

        {/* Badge */}
        <div style={{ display: "inline-block", marginBottom: "1.25rem", padding: "0.3rem 0.9rem", borderRadius: "9999px", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", fontSize: "0.75rem", fontWeight: 700, color: "#6ee7b7", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {lang === "uz" ? "🇺🇿 O'zbekiston №1 ingliz tili markazi" : lang === "en" ? "🏆 Modern English Learning Platform" : "🏆 Современная платформа изучения языка"}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "clamp(1.75rem, 5vw, 3rem)", fontWeight: 800, color: "white",
          margin: "0 auto 1rem", maxWidth: "700px", lineHeight: 1.2,
          fontFamily: "var(--font-playfair, Georgia, serif)",
        }}>
          {t.heroTitle}
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "rgba(255,255,255,0.72)", margin: "0 auto 2.5rem", maxWidth: "520px", lineHeight: 1.65 }}>
          {t.heroSub}
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.875rem 2rem", borderRadius: "0.75rem",
            background: "#34d399", color: "#064e3b",
            fontWeight: 800, fontSize: "1rem", textDecoration: "none",
            boxShadow: "0 8px 24px rgba(52,211,153,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}>
            {t.signIn} →
          </Link>
          {hasContact && (
            <a
              href={telegramUrl || `mailto:${contactEmail}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.875rem 2rem", borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.1)", color: "white",
                fontWeight: 700, fontSize: "1rem", textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {lang === "uz" ? "Bog'lanish" : lang === "en" ? "Contact Us" : "Связаться"}
            </a>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", marginTop: "3.5rem", flexWrap: "wrap" }}>
          {[
            { n: "500+", label: lang === "uz" ? "O'quvchilar" : lang === "en" ? "Students" : "Учеников" },
            { n: "20+",  label: lang === "uz" ? "O'qituvchilar" : lang === "en" ? "Teachers" : "Учителей" },
            { n: "50+",  label: lang === "uz" ? "Guruhlar" : lang === "en" ? "Groups" : "Групп" },
          ].map(s => (
            <div key={s.n} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#34d399" }}>{s.n}</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", background: "#f8fafc" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.375rem, 3vw, 2rem)", fontWeight: 800, color: "#1e293b", marginBottom: "0.5rem" }}>
            {t.featuresTitle}
          </h2>
          <p style={{ textAlign: "center", color: "#64748b", marginBottom: "3rem", fontSize: "0.95rem" }}>
            {lang === "uz" ? "Hamma uchun qulay platforma" : lang === "en" ? "Built for everyone in the academy" : "Удобная платформа для всех"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {t.features.map((f, i) => (
              <div key={i} style={{
                background: "white", borderRadius: "1rem", padding: "1.75rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.875rem" }}>{f.icon}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT / REQUEST ACCESS ─────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #1e3d2d 0%, #2a5c45 100%)",
        padding: "5rem 1.5rem", textAlign: "center",
      }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📬</div>
          <h2 style={{ fontSize: "clamp(1.375rem, 3vw, 2rem)", fontWeight: 800, color: "white", margin: "0 0 0.75rem" }}>
            {t.contactTitle}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.95rem", lineHeight: 1.65, margin: "0 0 2.5rem" }}>
            {t.contactDesc}
          </p>

          {hasContact ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.875rem 2rem", borderRadius: "0.75rem", width: "100%", maxWidth: "340px", justifyContent: "center",
                    background: "#229ED9", color: "white",
                    fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
                    boxShadow: "0 4px 16px rgba(34,158,217,0.35)",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.668l-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.96.891z"/>
                  </svg>
                  {t.telegram}
                </a>
              )}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.875rem 2rem", borderRadius: "0.75rem", width: "100%", maxWidth: "340px", justifyContent: "center",
                    background: "rgba(255,255,255,0.12)", color: "white",
                    fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>✉️</span>
                  {t.email}
                </a>
              )}
            </div>
          ) : (
            <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.08)", borderRadius: "0.75rem", border: "1px dashed rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.55)", fontSize: "0.9rem" }}>
              {t.noContact}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer style={{
        background: "#111827", color: "rgba(255,255,255,0.4)",
        padding: "1.5rem", textAlign: "center", fontSize: "0.78rem",
      }}>
        © {new Date().getFullYear()} {academyName}. {t.footer}
      </footer>
    </div>
  );
}

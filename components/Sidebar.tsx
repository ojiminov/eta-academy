"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

interface SidebarProps { role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT"; userName: string; }

const roleColor   = { ADMIN: "#6366f1", TEACHER: "#10b981", STUDENT: "#f59e0b", PARENT: "#ec4899" };
const roleGradient = {
  ADMIN:   "linear-gradient(135deg,#6366f1,#8b5cf6)",
  TEACHER: "linear-gradient(135deg,#059669,#10b981)",
  STUDENT: "linear-gradient(135deg,#d97706,#f59e0b)",
  PARENT:  "linear-gradient(135deg,#db2777,#ec4899)",
};

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const t        = useTranslations();
  const [open, setOpen] = useState(false);

  // ── Full navigation (drawer) ──────────────────────────
  const adminNav = [
    { href: "/admin",               icon: "📊", label: t("nav.dashboard") },
    { href: "/admin/students",      icon: "👨‍🎓", label: t("nav.students") },
    { href: "/admin/leads",         icon: "🎯", label: t("nav.leads") },
    { href: "/admin/teachers",      icon: "👨‍🏫", label: t("nav.teachers") },
    { href: "/admin/groups",        icon: "📚", label: t("nav.groups") },
    { href: "/admin/payments",      icon: "💳", label: t("nav.payments") },
    { href: "/admin/debtors",       icon: "⚠️", label: t("nav.debtors") },
    { href: "/admin/expenses",      icon: "💸", label: t("nav.expenses") },
    { href: "/admin/homeworks",     icon: "📋", label: t("nav.homework") },
    { href: "/admin/exams",         icon: "📝", label: t("nav.exams") },
    { href: "/admin/announcements", icon: "📢", label: t("nav.announcements") },
    { href: "/admin/attendance",    icon: "📅", label: t("nav.attendanceReport") },
    { href: "/leaderboard",         icon: "🏆", label: t("nav.leaderboard") },
  ];
  const teacherNav = [
    { href: "/teacher",                 icon: "📊", label: t("nav.dashboard") },
    { href: "/teacher/groups",          icon: "📚", label: t("nav.myGroups") },
    { href: "/teacher/sessions",        icon: "📅", label: t("nav.sessions") },
    { href: "/teacher/attendance",      icon: "✅", label: t("nav.attendance") },
    { href: "/teacher/attendance/scan", icon: "📷", label: t("nav.qrScan") },
    { href: "/teacher/grades",          icon: "📝", label: t("nav.grades") },
    { href: "/teacher/homework",        icon: "📋", label: t("nav.homework") },
    { href: "/teacher/exams",           icon: "🧪", label: t("nav.exams") },
    { href: "/leaderboard",             icon: "🏆", label: t("nav.leaderboard") },
  ];
  const studentNav = [
    { href: "/student",            icon: "🏠", label: t("nav.dashboard") },
    { href: "/student/qr",         icon: "📱", label: t("nav.myQR") },
    { href: "/student/coins",      icon: "🪙", label: t("nav.myCoins") },
    { href: "/student/homework",   icon: "📋", label: t("nav.homework") },
    { href: "/student/exams",      icon: "🧪", label: t("nav.exams") },
    { href: "/student/grades",     icon: "📝", label: t("nav.grades") },
    { href: "/student/attendance", icon: "✅", label: t("nav.attendance") },
    { href: "/student/groups",     icon: "📚", label: t("nav.myClasses") },
    { href: "/student/timetable",  icon: "🗓️", label: t("nav.timetable") },
    { href: "/student/payments",   icon: "💳", label: t("nav.payments") },
    { href: "/leaderboard",        icon: "🏆", label: t("nav.leaderboard") },
  ];
  const parentNav = [
    { href: "/parent",            icon: "🏠", label: t("nav.dashboard") },
    { href: "/parent/attendance", icon: "✅", label: t("nav.attendance") },
    { href: "/parent/grades",     icon: "📝", label: t("nav.grades") },
    { href: "/parent/payments",   icon: "💳", label: t("nav.payments") },
    { href: "/parent/schedule",   icon: "🗓️", label: t("nav.timetable") },
    { href: "/leaderboard",       icon: "🏆", label: t("nav.leaderboard") },
  ];

  // ── Role-curated bottom nav (most useful on mobile) ───
  const bottomNavMap: Record<string, { href: string; icon: string; label: string }[]> = {
    STUDENT: [
      { href: "/student",       icon: "🏠",  label: "Home" },
      { href: "/student/qr",    icon: "📱",  label: "My QR" },
      { href: "/student/coins", icon: "🪙",  label: "Coins" },
      { href: "/leaderboard",   icon: "🏆",  label: "Ranks" },
    ],
    TEACHER: [
      { href: "/teacher",                 icon: "🏠", label: "Home" },
      { href: "/teacher/attendance/scan", icon: "📷", label: "Scan QR" },
      { href: "/teacher/sessions",        icon: "📅", label: "Sessions" },
      { href: "/teacher/groups",          icon: "📚", label: "Groups" },
    ],
    ADMIN: [
      { href: "/admin",          icon: "📊", label: "Dashboard" },
      { href: "/admin/students", icon: "👨‍🎓", label: "Students" },
      { href: "/admin/payments", icon: "💳", label: "Payments" },
      { href: "/leaderboard",    icon: "🏆", label: "Ranks" },
    ],
    PARENT: [
      { href: "/parent",            icon: "🏠", label: "Home" },
      { href: "/parent/attendance", icon: "✅", label: "Attend" },
      { href: "/parent/grades",     icon: "📝", label: "Grades" },
      { href: "/parent/payments",   icon: "💳", label: "Payments" },
    ],
  };

  const navMap = { ADMIN: adminNav, TEACHER: teacherNav, STUDENT: studentNav, PARENT: parentNav };
  const nav      = navMap[role];
  const bottomNav = bottomNavMap[role];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function isActive(href: string) {
    const base = `/${role.toLowerCase()}`;
    if (href === base || href === "/leaderboard") return pathname === href;
    return pathname.startsWith(href);
  }

  // ── Sub-components ────────────────────────────────────
  const Logo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div style={{
        width: "40px", height: "40px",
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        borderRadius: "10px", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "1.25rem", flexShrink: 0,
      }}>🎓</div>
      <div>
        <div style={{ color: "white", fontWeight: "700", fontSize: "0.9rem", letterSpacing: "-0.01em" }}>ETA Academy</div>
        <div style={{ fontSize: "0.65rem", color: roleColor[role], fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t(`roles.${role}`)}
        </div>
      </div>
    </div>
  );

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={onClick} style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.625rem 0.875rem", borderRadius: "0.625rem", marginBottom: "2px",
            color: active ? "white" : "rgba(255,255,255,0.55)",
            background: active ? "rgba(99,102,241,0.35)" : "transparent",
            textDecoration: "none", fontSize: "0.875rem",
            fontWeight: active ? "700" : "400", transition: "all 0.15s",
            borderLeft: active ? "3px solid #818cf8" : "3px solid transparent",
          }}>
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{item.icon}</span>
            <span>{item.label}</span>
            {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#818cf8" }} />}
          </Link>
        );
      })}
    </>
  );

  const UserFooter = ({ compact }: { compact?: boolean }) => (
    <div style={{ padding: compact ? "0.875rem" : "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
        <div style={{
          width: "36px", height: "36px", background: roleGradient[role], borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "700", fontSize: "0.875rem", flexShrink: 0,
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ color: "white", fontSize: "0.8rem", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName}
          </div>
          <div style={{ fontSize: "0.65rem", color: roleColor[role], textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.06em" }}>
            {t(`roles.${role}`)}
          </div>
        </div>
      </div>
      <button onClick={handleLogout} style={{
        width: "100%", padding: "0.5rem",
        background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem",
        fontSize: "0.8rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        transition: "background 0.15s",
      }}>
        🚪 {t("nav.signOut")}
      </button>
    </div>
  );

  return (
    <>
      {/* ══ DESKTOP SIDEBAR ════════════════════════════════ */}
      <aside className="eta-sidebar-desktop" style={{
        width: "240px", minHeight: "100vh", background: "#16132a",
        display: "flex", flexDirection: "column", flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Logo />
        </div>
        <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <LanguageSwitcher />
        </div>
        <nav style={{ flex: 1, padding: "0.75rem 0.625rem", overflowY: "auto" }}>
          <NavLinks />
        </nav>
        <UserFooter />
      </aside>

      {/* ══ MOBILE TOP BAR ═════════════════════════════════
           Height = 56px chrome + env(safe-area-inset-top) so
           the bar extends behind the Dynamic Island / notch.
           The inner row is pushed down by the safe-area amount.
      ════════════════════════════════════════════════════ */}
      <div className="eta-mobile-topbar" style={{
        display: "none",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "#16132a",
        /* Total height covers notch + 56px usable bar */
        height: "calc(var(--topbar-h) + env(safe-area-inset-top, 0px))",
        /* Flex column so we can push the row below the notch */
        flexDirection: "column",
        justifyContent: "flex-end",
        boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {/* Actual 56px content row — sits below notch */}
        <div style={{
          height: "var(--topbar-h)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 1rem", position: "relative",
        }}>
          {/* Hamburger */}
          <button onClick={() => setOpen(true)} style={{
            background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
            borderRadius: "0.625rem", width: "40px", height: "40px",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "5px", padding: "0",
          }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ display: "block", width: "20px", height: "2px", background: "white", borderRadius: "2px" }} />
            ))}
          </button>

          {/* Centre logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <span style={{ fontSize: "1.15rem" }}>🎓</span>
            <span style={{ color: "white", fontWeight: "800", fontSize: "1rem", letterSpacing: "-0.02em" }}>ETA Academy</span>
          </div>

          {/* Avatar */}
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: roleGradient[role],
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: "700", fontSize: "0.85rem",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ══ MOBILE DRAWER OVERLAY ══════════════════════════ */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
        />
      )}

      {/* ══ MOBILE DRAWER ══════════════════════════════════ */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 201,
        width: "280px", background: "#16132a",
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: open ? "4px 0 24px rgba(0,0,0,0.4)" : "none",
        /* Drawer header accounts for notch too */
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <button onClick={() => setOpen(false)} style={{
            background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.7)",
            fontSize: "1.1rem", cursor: "pointer", borderRadius: "0.5rem",
            width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <LanguageSwitcher />
        </div>
        <nav style={{ flex: 1, padding: "0.75rem 0.625rem", overflowY: "auto" }}>
          <NavLinks onClick={() => setOpen(false)} />
        </nav>
        <UserFooter compact />
      </div>

      {/* ══ MOBILE BOTTOM NAV ══════════════════════════════ */}
      <div className="eta-mobile-bottomnav" style={{
        display: "none",
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "#16132a",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        height: "var(--bottomnav-h)",
        alignItems: "stretch", justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
      }}>
        {/* Curated 4 key items */}
        {bottomNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "3px",
              textDecoration: "none", flex: 1,
              color: active ? "white" : "rgba(255,255,255,0.4)",
              position: "relative",
              minWidth: 0,
            }}>
              {/* Active indicator bar */}
              {active && (
                <span style={{
                  position: "absolute", top: 0, left: "25%", right: "25%",
                  height: "2px", background: roleColor[role],
                  borderRadius: "0 0 3px 3px",
                }} />
              )}
              {/* Icon pill */}
              <span style={{
                fontSize: "1.45rem", lineHeight: 1,
                background: active ? `${roleColor[role]}22` : "transparent",
                padding: "4px 10px", borderRadius: "0.5rem",
                transition: "background 0.15s",
              }}>
                {item.icon}
              </span>
              <span style={{
                fontSize: "0.65rem", fontWeight: active ? "700" : "500",
                color: active ? roleColor[role] : "rgba(255,255,255,0.45)",
                letterSpacing: "0.01em",
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More → opens drawer */}
        <button onClick={() => setOpen(true)} style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: "3px",
          background: "none", border: "none", cursor: "pointer", flex: 1,
          color: "rgba(255,255,255,0.4)", minWidth: 0,
        }}>
          <span style={{ fontSize: "1.45rem", lineHeight: 1, padding: "4px 10px", borderRadius: "0.5rem" }}>☰</span>
          <span style={{ fontSize: "0.65rem", fontWeight: "500", color: "rgba(255,255,255,0.45)" }}>More</span>
        </button>
      </div>
    </>
  );
}

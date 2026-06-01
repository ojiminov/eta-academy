"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useBranding } from "./BrandingProvider";

interface SidebarProps { role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT"; userName: string; }

const roleColor   = { ADMIN: "#6ee7b7", TEACHER: "#6ee7b7", STUDENT: "#6ee7b7", PARENT: "#6ee7b7" };
const roleGradient = {
  ADMIN:   "linear-gradient(135deg,#2a5c45,#3a7a5c)",
  TEACHER: "linear-gradient(135deg,#2a5c45,#3a7a5c)",
  STUDENT: "linear-gradient(135deg,#2a5c45,#3a7a5c)",
  PARENT:  "linear-gradient(135deg,#2a5c45,#3a7a5c)",
};

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const t        = useTranslations();
  const branding = useBranding();
  const [open, setOpen] = useState(false);

  // ── Full navigation (drawer) ──────────────────────────
  const adminNav = [
    { href: "/admin",               icon: "ti-layout-dashboard", label: t("nav.dashboard") },
    { href: "/admin/students",      icon: "ti-users", label: t("nav.students") },
    { href: "/admin/leads",         icon: "ti-target", label: t("nav.leads") },
    { href: "/admin/teachers",      icon: "ti-school", label: t("nav.teachers") },
    { href: "/admin/groups",        icon: "ti-books", label: t("nav.groups") },
    { href: "/admin/payments",      icon: "ti-credit-card", label: t("nav.payments") },
    { href: "/admin/debtors",       icon: "ti-alert-triangle red", label: t("nav.debtors") },
    { href: "/admin/expenses",      icon: "ti-report-money", label: t("nav.expenses") },
    { href: "/admin/homeworks",     icon: "ti-clipboard-list", label: t("nav.homework") },
    { href: "/admin/exams",         icon: "ti-pencil", label: t("nav.exams") },
    { href: "/admin/announcements", icon: "ti-speakerphone", label: t("nav.announcements") },
    { href: "/admin/attendance",    icon: "ti-calendar-check", label: t("nav.attendanceReport") },
    { href: "/leaderboard",         icon: "ti-trophy amber", label: t("nav.leaderboard") },
    { href: "/admin/settings",      icon: "ti-palette", label: t("nav.branding") },
  ];
  const teacherNav = [
    { href: "/teacher",                 icon: "ti-layout-dashboard", label: t("nav.dashboard") },
    { href: "/teacher/groups",          icon: "ti-books", label: t("nav.myGroups") },
    { href: "/teacher/sessions",        icon: "ti-calendar-event", label: t("nav.sessions") },
    { href: "/teacher/attendance",      icon: "ti-calendar-check", label: t("nav.attendance") },
    { href: "/teacher/attendance/scan", icon: "ti-qrcode", label: t("nav.qrScan") },
    { href: "/teacher/grades",          icon: "ti-chart-bar", label: t("nav.grades") },
    { href: "/teacher/homework",        icon: "ti-clipboard-list", label: t("nav.homework") },
    { href: "/teacher/exams",           icon: "ti-pencil", label: t("nav.exams") },
    { href: "/teacher/materials",       icon: "ti-folder", label: t("nav.materials") },
    { href: "/leaderboard",             icon: "ti-trophy amber", label: t("nav.leaderboard") },
  ];
  const studentNav = [
    { href: "/student",            icon: "ti-layout-dashboard", label: t("nav.dashboard") },
    { href: "/student/qr",         icon: "ti-qrcode", label: t("nav.myQR") },
    { href: "/student/coins",      icon: "ti-coin amber", label: t("nav.myCoins") },
    { href: "/student/homework",   icon: "ti-clipboard-list", label: t("nav.homework") },
    { href: "/student/materials",  icon: "ti-folder", label: t("nav.materials") },
    { href: "/student/exams",      icon: "ti-pencil", label: t("nav.exams") },
    { href: "/student/grades",     icon: "ti-chart-bar", label: t("nav.grades") },
    { href: "/student/attendance", icon: "ti-calendar-check", label: t("nav.attendance") },
    { href: "/student/groups",     icon: "ti-books", label: t("nav.myClasses") },
    { href: "/student/timetable",  icon: "ti-calendar", label: t("nav.timetable") },
    { href: "/student/payments",   icon: "ti-credit-card", label: t("nav.payments") },
    { href: "/leaderboard",        icon: "ti-trophy amber", label: t("nav.leaderboard") },
  ];
  const parentNav = [
    { href: "/parent",            icon: "ti-layout-dashboard", label: t("nav.dashboard") },
    { href: "/parent/attendance", icon: "ti-calendar-check", label: t("nav.attendance") },
    { href: "/parent/grades",     icon: "ti-chart-bar", label: t("nav.grades") },
    { href: "/parent/payments",   icon: "ti-credit-card", label: t("nav.payments") },
    { href: "/parent/schedule",   icon: "ti-calendar", label: t("nav.timetable") },
    { href: "/leaderboard",       icon: "ti-trophy amber", label: t("nav.leaderboard") },
  ];

  // ── Role-curated bottom nav (most useful on mobile) ───
  const bottomNavMap: Record<string, { href: string; icon: string; label: string }[]> = {
    STUDENT: [
      { href: "/student",       icon: "ti-layout-dashboard",  label: "Home" },
      { href: "/student/qr",    icon: "ti-qrcode",  label: "My QR" },
      { href: "/student/coins", icon: "ti-coin amber",  label: "Coins" },
      { href: "/leaderboard",   icon: "ti-trophy amber",  label: "Ranks" },
    ],
    TEACHER: [
      { href: "/teacher",                 icon: "ti-layout-dashboard", label: "Home" },
      { href: "/teacher/attendance/scan", icon: "ti-qrcode", label: "Scan QR" },
      { href: "/teacher/sessions",        icon: "ti-calendar-event", label: "Sessions" },
      { href: "/teacher/groups",          icon: "ti-books", label: "Groups" },
    ],
    ADMIN: [
      { href: "/admin",          icon: "ti-layout-dashboard", label: "Dashboard" },
      { href: "/admin/students", icon: "ti-users", label: "Students" },
      { href: "/admin/payments", icon: "ti-credit-card", label: "Payments" },
      { href: "/leaderboard",    icon: "ti-trophy amber", label: "Ranks" },
    ],
    PARENT: [
      { href: "/parent",            icon: "ti-layout-dashboard", label: "Home" },
      { href: "/parent/attendance", icon: "ti-calendar-check", label: "Attend" },
      { href: "/parent/grades",     icon: "ti-chart-bar", label: "Grades" },
      { href: "/parent/payments",   icon: "ti-credit-card", label: "Payments" },
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
  const renderLogo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      {branding.logoUrl ? (
        <img
          src={branding.logoUrl}
          alt={branding.name}
          className="eta-brand-mark"
          style={{ objectFit: "contain", mixBlendMode: "screen" }}
        />
      ) : (
        <div className="eta-brand-mark">ETA</div>
      )}
      <div>
        <div style={{ color: "white", fontWeight: "800", fontSize: "0.95rem", letterSpacing: 0 }}>{branding.name}</div>
        <div style={{ fontSize: "0.68rem", color: "#cbd5e1", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t(`roles.${role}`)}
        </div>
      </div>
    </div>
  );

  const renderNavLinks = (onClick?: () => void) => (
    <>
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={onClick} className={`eta-nav-link${active ? " is-active" : ""}`}>
            <i className={`ti ${item.icon} nav-icon accent`} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  const renderUserFooter = (compact?: boolean) => (
    <div style={{ padding: compact ? "0.875rem" : "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
        <div className="eta-avatar" style={{ background: roleGradient[role], color: "white", fontWeight: "800", fontSize: "0.875rem" }}>
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
      <button onClick={handleLogout} title={t("nav.signOut")} style={{
        width: "100%", padding: "0.5rem",
        background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.74)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem",
        fontSize: "0.8rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        transition: "background 0.15s",
      }}>
        <span aria-hidden="true">↪</span> {t("nav.signOut")}
      </button>
    </div>
  );

  return (
    <>
      {/* ══ DESKTOP SIDEBAR ════════════════════════════════ */}
      <aside className="eta-sidebar-desktop" style={{
        width: "252px", minHeight: "100vh",
        display: "flex", flexDirection: "column", flexShrink: 0,
        borderRight: "1px solid rgba(15,23,42,0.08)",
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {renderLogo()}
        </div>
        <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <LanguageSwitcher />
        </div>
        <nav style={{ flex: 1, padding: "0.75rem 0.625rem", overflowY: "auto" }}>
          {renderNavLinks()}
        </nav>
        {renderUserFooter()}
      </aside>

      {/* ══ MOBILE TOP BAR ═════════════════════════════════
           Height = 56px chrome + env(safe-area-inset-top) so
           the bar extends behind the Dynamic Island / notch.
           The inner row is pushed down by the safe-area amount.
      ════════════════════════════════════════════════════ */}
      <div className="eta-mobile-topbar" style={{
        display: "none",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: "calc(var(--topbar-h) + env(safe-area-inset-top, 0px))",
        flexDirection: "column",
        justifyContent: "flex-end",
        boxShadow: "0 2px 16px rgba(15,23,42,0.2)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
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
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.name} style={{ width:28, height:28, objectFit:"contain", borderRadius:"6px", mixBlendMode:"screen" }} />
            ) : (
              <span style={{ fontSize: "0.8rem", fontWeight: 900 }}>ETA</span>
            )}
            <span style={{ color: "white", fontWeight: "800", fontSize: "1rem", letterSpacing: 0 }}>{branding.name}</span>
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
        width: "280px",
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: open ? "4px 0 24px rgba(0,0,0,0.4)" : "none",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }} className="eta-mobile-drawer">
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {renderLogo()}
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
          {renderNavLinks(() => setOpen(false))}
        </nav>
        {renderUserFooter(true)}
      </div>

      {/* ══ MOBILE BOTTOM NAV ══════════════════════════════ */}
      <div className="eta-mobile-bottomnav" style={{
        display: "none",
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
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
              {active && (
                <span style={{
                  position: "absolute", top: 0, left: "25%", right: "25%",
                  height: "2px", background: roleColor[role],
                  borderRadius: "0 0 3px 3px",
                }} />
              )}
              <span style={{
                fontSize: "0.76rem", lineHeight: 1, fontWeight: 900,
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
          <span style={{ fontSize: "1rem", lineHeight: 1, padding: "4px 10px", borderRadius: "0.5rem" }}>☰</span>
          <span style={{ fontSize: "0.65rem", fontWeight: "500", color: "rgba(255,255,255,0.45)" }}>More</span>
        </button>
      </div>
    </>
  );
}

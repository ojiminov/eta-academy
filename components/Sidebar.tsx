"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

interface SidebarProps { role: "ADMIN" | "TEACHER" | "STUDENT"; userName: string; }

const roleColor = { ADMIN: "#6366f1", TEACHER: "#10b981", STUDENT: "#f59e0b" };

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const adminNav = [
    { href: "/admin",               icon: "📊", label: t("nav.dashboard") },
    { href: "/admin/students",      icon: "👨‍🎓", label: t("nav.students") },
    { href: "/admin/teachers",      icon: "👨‍🏫", label: t("nav.teachers") },
    { href: "/admin/groups",        icon: "📚", label: t("nav.groups") },
    { href: "/admin/payments",      icon: "💳", label: t("nav.payments") },
    { href: "/admin/announcements", icon: "📢", label: t("nav.announcements") },
  ];
  const teacherNav = [
    { href: "/teacher",            icon: "📊", label: t("nav.dashboard") },
    { href: "/teacher/groups",     icon: "📚", label: t("nav.myGroups") },
    { href: "/teacher/sessions",   icon: "📅", label: t("nav.sessions") },
    { href: "/teacher/attendance", icon: "✅", label: t("nav.attendance") },
    { href: "/teacher/grades",     icon: "📝", label: t("nav.grades") },
  ];
  const studentNav = [
    { href: "/student",            icon: "📊", label: t("nav.dashboard") },
    { href: "/student/groups",     icon: "📚", label: t("nav.myClasses") },
    { href: "/student/attendance", icon: "✅", label: t("nav.attendance") },
    { href: "/student/grades",     icon: "📝", label: t("nav.grades") },
    { href: "/student/payments",   icon: "💳", label: t("nav.payments") },
  ];
  const navMap = { ADMIN: adminNav, TEACHER: teacherNav, STUDENT: studentNav };
  const nav = navMap[role];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {nav.map((item) => {
        const isActive = item.href === `/${role.toLowerCase()}`
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={onClick} style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.625rem 0.75rem", borderRadius: "0.5rem", marginBottom: "0.25rem",
            color: isActive ? "white" : "rgba(255,255,255,0.6)",
            background: isActive ? "rgba(99,102,241,0.3)" : "transparent",
            textDecoration: "none", fontSize: "0.875rem",
            fontWeight: isActive ? "600" : "400", transition: "all 0.2s",
          }}>
            <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </>
  );

  const UserFooter = () => (
    <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div style={{
          width: "36px", height: "36px", background: roleColor[role], borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "700", fontSize: "0.875rem", flexShrink: 0,
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ color: "white", fontSize: "0.8rem", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName}
          </div>
          <div style={{ fontSize: "0.65rem", color: roleColor[role], textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>
            {t(`roles.${role}`)}
          </div>
        </div>
      </div>
      {/* Language switcher */}
      <div style={{ marginBottom: "0.625rem" }}>
        <LanguageSwitcher />
      </div>
      <button onClick={handleLogout} style={{
        width: "100%", padding: "0.5rem",
        background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)",
        border: "none", borderRadius: "0.5rem", fontSize: "0.8rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
      }}>
        🚪 {t("nav.signOut")}
      </button>
    </div>
  );

  const Logo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div style={{
        width: "40px", height: "40px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem",
      }}>🎓</div>
      <div>
        <div style={{ color: "white", fontWeight: "700", fontSize: "0.9rem" }}>ETA Academy</div>
        <div style={{ fontSize: "0.65rem", color: roleColor[role], fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t(`roles.${role}`)}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────── */}
      <aside className="eta-sidebar-desktop" style={{
        width: "240px", minHeight: "100vh", background: "#1e1b4b",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Logo />
        </div>
        <nav style={{ flex: 1, padding: "1rem 0.75rem" }}>
          <NavLinks />
        </nav>
        <UserFooter />
      </aside>

      {/* ── MOBILE TOP BAR ──────────────────── */}
      <div className="eta-mobile-topbar" style={{
        display: "none", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "#1e1b4b", height: "56px",
        alignItems: "center", justifyContent: "space-between", padding: "0 1rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}>
        <button onClick={() => setOpen(true)} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", gap: "5px", padding: "4px",
        }}>
          {[0,1,2].map(i => <span key={i} style={{ display: "block", width: "22px", height: "2px", background: "white", borderRadius: "2px" }} />)}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>🎓</span>
          <span style={{ color: "white", fontWeight: "700", fontSize: "0.95rem" }}>ETA Academy</span>
        </div>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%", background: roleColor[role],
          display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "0.8rem",
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ───────────── */}
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)" }} />}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 201,
        width: "260px", background: "#1e1b4b", display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease",
      }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.3rem", cursor: "pointer" }}>✕</button>
        </div>
        <nav style={{ flex: 1, padding: "1rem 0.75rem", overflowY: "auto" }}>
          <NavLinks onClick={() => setOpen(false)} />
        </nav>
        <UserFooter />
      </div>

      {/* ── MOBILE BOTTOM NAV ───────────────── */}
      <div className="eta-mobile-bottomnav" style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "#1e1b4b", borderTop: "1px solid rgba(255,255,255,0.1)",
        height: "60px", alignItems: "center", justifyContent: "space-around",
      }}>
        {nav.slice(0, 5).map((item) => {
          const isActive = item.href === `/${role.toLowerCase()}`
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
              textDecoration: "none", flex: 1, padding: "6px 0",
              color: isActive ? "white" : "rgba(255,255,255,0.45)",
            }}>
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: isActive ? "600" : "400" }}>
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

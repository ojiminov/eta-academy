"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  role: "ADMIN" | "TEACHER" | "STUDENT";
  userName: string;
}

const adminNav: NavItem[] = [
  { href: "/admin", icon: "📊", label: "Dashboard" },
  { href: "/admin/students", icon: "👨‍🎓", label: "Students" },
  { href: "/admin/teachers", icon: "👨‍🏫", label: "Teachers" },
  { href: "/admin/groups", icon: "📚", label: "Groups" },
  { href: "/admin/payments", icon: "💳", label: "Payments" },
  { href: "/admin/announcements", icon: "📢", label: "Announcements" },
];

const teacherNav: NavItem[] = [
  { href: "/teacher", icon: "📊", label: "Dashboard" },
  { href: "/teacher/groups", icon: "📚", label: "My Groups" },
  { href: "/teacher/sessions", icon: "📅", label: "Sessions" },
  { href: "/teacher/attendance", icon: "✅", label: "Attendance" },
  { href: "/teacher/grades", icon: "📝", label: "Grades" },
];

const studentNav: NavItem[] = [
  { href: "/student", icon: "📊", label: "Dashboard" },
  { href: "/student/groups", icon: "📚", label: "My Classes" },
  { href: "/student/attendance", icon: "✅", label: "Attendance" },
  { href: "/student/grades", icon: "📝", label: "Grades" },
  { href: "/student/payments", icon: "💳", label: "Payments" },
];

const navMap = { ADMIN: adminNav, TEACHER: teacherNav, STUDENT: studentNav };
const roleColor = { ADMIN: "#6366f1", TEACHER: "#10b981", STUDENT: "#f59e0b" };
const roleLabel = { ADMIN: "Administrator", TEACHER: "Teacher", STUDENT: "Student" };

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = navMap[role];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "#1e1b4b",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
            }}
          >
            🎓
          </div>
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "0.9rem" }}>
              ETA Academy
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: roleColor[role],
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {roleLabel[role]}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem" }}>
        {nav.map((item) => {
          const isActive =
            item.href === `/${role.toLowerCase()}`
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "0.5rem",
                marginBottom: "0.25rem",
                color: isActive ? "white" : "rgba(255,255,255,0.6)",
                background: isActive ? "rgba(99,102,241,0.3)" : "transparent",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? "600" : "400",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div
        style={{
          padding: "1rem",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: roleColor[role],
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "700",
              fontSize: "0.875rem",
              flexShrink: 0,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                color: "white",
                fontSize: "0.8rem",
                fontWeight: "500",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "0.5rem",
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import UzbekDatePicker, { UZ_MONTHS, UZ_WEEKDAYS, toPickerString } from "@/components/UzbekDatePicker";

type Child = {
  id: string;
  user: { firstName: string; lastName: string; email: string };
  englishLevel: string;
  balance: number;
  status: string;
  groupStudents: { group: { name: string; schedule: string; teacher: { user: { firstName: string; lastName: string } } } }[];
  payments: { amount: number; status: string; createdAt: string }[];
  grades: { score: number; maxScore: number; label?: string; createdAt: string }[];
  homeworkGrades: { status: string; score?: number; homework: { title: string; dueDate: string } }[];
  examResults: { score?: number; exam: { title: string; maxScore: number; scheduledAt: string } }[];
  attendances: { status: string; classSession: { scheduledAt: string; group: { name: string } } }[];
};
type ChildData = { parent: { id: string }; children: Child[] };

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER:"Beginner", ELEMENTARY:"Elementary", PRE_INTERMEDIATE:"Pre-Intermediate",
  INTERMEDIATE:"Intermediate", UPPER_INTERMEDIATE:"Upper-Intermediate", ADVANCED:"Advanced"
};

const AVATAR_COLORS = ["#6366f1","#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316"];
function avatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function ParentDashboard() {
  const t = useTranslations();
  const [data, setData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChildIdx, setActiveChildIdx] = useState(0);

  useEffect(() => {
    fetch("/api/parent/child").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>{t("common.loading")}</div>;
  if (!data?.children?.length) return (
    <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
      {t("parent.parentNotFound")}
    </div>
  );

  const child = data.children[activeChildIdx] ?? data.children[0];
  const name = `${child.user.firstName} ${child.user.lastName}`;
  const initials = `${child.user.firstName.charAt(0)}${child.user.lastName.charAt(0)}`.toUpperCase();
  const aColor = avatarColor(name);

  const attPresent = child.attendances.filter(a => a.status === "PRESENT").length;
  const attTotal = child.attendances.length;
  const attRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;
  const avgGrade = child.grades?.length > 0 ? Math.round(child.grades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / child.grades.length) : null;
  const pendingPayments = child.payments.filter(p => p.status === "PENDING" || p.status === "OVERDUE").length;
  const pendingHomework = child.homeworkGrades.filter(h => h.status === "ASSIGNED" || h.status === "LATE").length;

  const now = new Date();
  const todayUz = `${UZ_WEEKDAYS[now.getDay()]}, ${now.getDate()}-${UZ_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const todayPickerValue = toPickerString(now);

  return (
    <div style={{ padding: "0", maxWidth: "100%" }}>
      {data.children.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", padding: "1rem 2rem 0", flexWrap: "wrap" }}>
          {data.children.map((c, i) => (
            <button key={c.id} onClick={() => setActiveChildIdx(i)} style={{
              padding: "0.4rem 1rem", borderRadius: "9999px", border: "2px solid",
              borderColor: activeChildIdx === i ? "#ec4899" : "#e2e8f0",
              background: activeChildIdx === i ? "#ec4899" : "white",
              color: activeChildIdx === i ? "white" : "#475569",
              fontSize: "0.85rem", fontWeight: "600", cursor: "pointer",
            }}>
              {c.user.firstName} {c.user.lastName}
            </button>
          ))}
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg, #ec4899 0%, #be185d 50%, #9d174d 100%)", padding: "2rem 2.5rem 3.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <UzbekDatePicker
            value={todayPickerValue}
            onChange={() => {}}
            readOnly
            includeTime={false}
            triggerStyle={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "0.5rem",
              color: "rgba(255,255,255,0.9)",
              padding: "0.3rem 0.75rem",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "inline-flex",
              width: "auto",
              marginBottom: "0.375rem",
              backdropFilter: "blur(4px)",
            }}
          />
          <h1 style={{ color: "white", fontSize: "1.875rem", fontWeight: "800", margin: "0 0 0.375rem", letterSpacing: "-0.025em" }}>
            {t("parent.parentDashboard")} 👨‍👩‍👧
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.9rem" }}>
            {t("parent.monitoringChild", { name })}{data.children.length > 1 ? ` · ${data.children.length} children` : ""}
          </p>
          {(pendingPayments > 0 || pendingHomework > 0) && (
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              {pendingPayments > 0 && (
                <Link href="/parent/payments" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(239,68,68,0.25)", backdropFilter: "blur(8px)", color: "white", textDecoration: "none", padding: "0.4rem 0.875rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "600", border: "1px solid rgba(239,68,68,0.4)" }}>
                  ⚠️ {pendingPayments > 1 ? t("parent.unpaidBills", { n: pendingPayments }) : t("parent.unpaidBill", { n: pendingPayments })}
                </Link>
              )}
              {pendingHomework > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(245,158,11,0.25)", backdropFilter: "blur(8px)", color: "white", padding: "0.4rem 0.875rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "600", border: "1px solid rgba(245,158,11,0.4)" }}>
                  📋 {t("parent.homeworkDueCount", { n: pendingHomework })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "0 2rem", marginTop: "-1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[
            { label: t("parent.attendanceStat"), value: `${attRate}%`, sub: `${attPresent}/${attTotal} sessions`, color: attRate >= 80 ? "#10b981" : "#ef4444", light: attRate >= 80 ? "#d1fae5" : "#fee2e2" },
            { label: t("parent.avgGrade"), value: avgGrade !== null ? `${avgGrade}%` : "—", sub: `${child.grades.length} grades`, color: "var(--primary)", light: "var(--primary-light, #ede9fe)" },
            { label: t("parent.pendingHW"), value: pendingHomework, sub: t("parent.toSubmit"), color: pendingHomework > 0 ? "#f59e0b" : "#10b981", light: pendingHomework > 0 ? "#fef3c7" : "#d1fae5" },
            { label: t("parent.unpaidBillsLabel"), value: pendingPayments, sub: `balance: ${child.balance.toLocaleString()}`, color: pendingPayments > 0 ? "#ef4444" : "#10b981", light: pendingPayments > 0 ? "#fee2e2" : "#d1fae5" },
          ].map(card => (
            <div key={card.label} style={{ background: "white", borderRadius: "1rem", padding: "1.375rem 1.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: card.color }} />
              <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", background: card.light, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: card.color }} />
              </div>
              <div style={{ fontSize: "2.25rem", fontWeight: "800", color: "#0f172a", lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</div>
              <div style={{ fontSize: "0.72rem", color: "#cbd5e1", marginTop: "0.125rem" }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "1.25rem 2rem 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <div style={{ background: "white", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: aColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.125rem", fontWeight: "700", flexShrink: 0 }}>{initials}</div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "1rem", color: "#0f172a" }}>{name}</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{LEVEL_LABELS[child.englishLevel]} · {child.groupStudents.length} group{child.groupStudents.length !== 1 ? "s" : ""}</div>
              <div style={{ fontSize: "0.72rem", color: child.balance < 0 ? "#dc2626" : "#10b981", fontWeight: "600", marginTop: "0.125rem" }}>Balance: {child.balance.toLocaleString()} UZS</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.125rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>{t("parent.classes")}</div>
            {child.groupStudents.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{t("parent.noClasses")}</div>
            ) : child.groupStudents.map((gs, i) => (
              <div key={i} style={{ padding: "0.625rem 0.75rem", background: "#f8fafc", borderRadius: "0.5rem", marginBottom: "0.5rem" }}>
                <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#0f172a" }}>{gs.group.name}</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.125rem" }}>👨‍🏫 {gs.group.teacher.user.firstName} {gs.group.teacher.user.lastName} · {gs.group.schedule}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("parent.recentHomework")}</h2>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.125rem 0 0" }}>{t("parent.latestAssignments")}</p>
            </div>
            <Link href="/parent/grades" style={{ fontSize: "0.78rem", color: "#ec4899", fontWeight: "600", textDecoration: "none", padding: "0.375rem 0.75rem", background: "#fdf2f8", borderRadius: "0.5rem", border: "1px solid #fbcfe8" }}>{t("common.viewAll")}</Link>
          </div>
          <div>
            {child.homeworkGrades.slice(0, 5).map((h, i) => {
              const st = h.status === "GRADED" ? { bg: "#dcfce7", color: "#16a34a", dot: "#16a34a" } : h.status === "LATE" ? { bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" } : { bg: "#fef3c7", color: "#ca8a04", dot: "#ca8a04" };
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.5rem", borderBottom: i < Math.min(child.homeworkGrades.length, 5) - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.homework.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{t("homework.dueDate")}: {new Date(h.homework.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.68rem", fontWeight: "700", background: st.bg, color: st.color, flexShrink: 0 }}>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: st.dot }} />
                    {h.score != null ? `${h.score} pts` : h.status}
                  </span>
                </div>
              );
            })}
            {child.homeworkGrades.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>{t("parent.noHomeworkYet")}</div>}
          </div>
        </div>
      </div>

      <div style={{ padding: "1.25rem 2rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[
            { href: "/parent/attendance", icon: "✅", label: t("parent.childAttendance"), color: "#10b981", bg: "#d1fae5" },
            { href: "/parent/grades",     icon: "📝", label: t("parent.childGrades"),     color: "var(--primary)", bg: "var(--primary-light, #ede9fe)" },
            { href: "/parent/payments",   icon: "💳", label: t("parent.childPayments"),   color: "#f59e0b", bg: "#fef3c7" },
            { href: "/parent/schedule",   icon: "🗓️", label: t("parent.childSchedule"),   color: "#ec4899", bg: "#fce7f3" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "1.125rem 1.25rem", background: "white", borderRadius: "0.875rem", border: "1px solid #e2e8f0", textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "0.625rem", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem", flexShrink: 0 }}>{item.icon}</div>
              <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>{item.label}</span>
              <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

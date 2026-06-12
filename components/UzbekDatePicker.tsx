"use client";

import { useState, useRef, useEffect } from "react";

export const UZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"
];
export const UZ_WEEKDAYS = [
  "Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"
];
const UZ_DAYS = ["Du","Se","Ch","Pa","Ju","Sh","Ya"]; // Mon→Sun

function dayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function toPickerString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  includeTime?: boolean;
  readOnly?: boolean;
  style?: React.CSSProperties;
  triggerStyle?: React.CSSProperties;
};

export default function UzbekDatePicker({
  value, onChange,
  placeholder = "Sanani tanlang...",
  includeTime = true,
  readOnly = false,
  style,
  triggerStyle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth() : new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value) : null;

  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function fmt(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function selectDay(day: number) {
    if (readOnly) return;
    const base = selected ? new Date(selected) : new Date();
    base.setFullYear(viewYear); base.setMonth(viewMonth); base.setDate(day);
    if (!includeTime) { base.setHours(0); base.setMinutes(0); }
    onChange(fmt(base));
    if (!includeTime) setOpen(false);
  }

  function changeTime(type: "h" | "m", val: string) {
    const base = selected ? new Date(selected) : new Date(viewYear, viewMonth, 1);
    if (type === "h") base.setHours(Math.max(0, Math.min(23, Number(val))));
    else base.setMinutes(Math.max(0, Math.min(59, Number(val))));
    onChange(fmt(base));
  }

  const startPad = dayIndex(new Date(viewYear, viewMonth, 1));
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();

  const displayStr = selected
    ? `${selected.getDate()} ${UZ_MONTHS[selected.getMonth()]} ${selected.getFullYear()}${includeTime ? ` · ${String(selected.getHours()).padStart(2,"0")}:${String(selected.getMinutes()).padStart(2,"0")}` : ""}`
    : "";

  const defaultTrigger: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    cursor: readOnly ? "default" : "pointer",
    background: "white",
    fontSize: "0.875rem",
    color: selected ? "#0f172a" : "#94a3b8",
    display: "flex", alignItems: "center", gap: "0.5rem",
    userSelect: "none",
    boxSizing: "border-box" as const,
    width: "100%",
  };

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <div onClick={() => setOpen(o => !o)} style={{ ...defaultTrigger, ...triggerStyle }}>
        <span>📅</span>
        <span style={{ flex: 1 }}>{displayStr || placeholder}</span>
        {!readOnly && <span style={{ color: "inherit", opacity: 0.6, fontSize: "0.7rem" }}>▼</span>}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 9999,
          background: "white", border: "1px solid #e2e8f0",
          borderRadius: "1rem", boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
          padding: "1rem", minWidth: "296px",
        }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <button
              onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); }}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", width: 30, height: 30, cursor: "pointer", fontWeight: "700", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            <span style={{ fontWeight: "800", fontSize: "0.9rem", color: "#0f172a" }}>
              {UZ_MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y=>y+1); } else setViewMonth(m=>m+1); }}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", width: 30, height: 30, cursor: "pointer", fontWeight: "700", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {UZ_DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: "700", color: "#94a3b8", padding: "0.2rem 0" }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array(startPad).fill(null).map((_,i) => <div key={`p${i}`} />)}
            {Array.from({ length: daysInMonth }, (_,i) => i+1).map(day => {
              const isToday = today.getDate()===day && today.getMonth()===viewMonth && today.getFullYear()===viewYear;
              const isSel = selected && selected.getDate()===day && selected.getMonth()===viewMonth && selected.getFullYear()===viewYear;
              return (
                <button key={day} onClick={() => selectDay(day)} style={{
                  padding: "0.35rem 0", border: "none", borderRadius: "0.375rem",
                  cursor: readOnly ? "default" : "pointer",
                  fontSize: "0.8rem",
                  fontWeight: isSel || isToday ? "700" : "400",
                  background: isSel ? "var(--primary, #6366f1)" : isToday ? "var(--primary-light, #ede9fe)" : "transparent",
                  color: isSel ? "white" : isToday ? "var(--primary, #6366f1)" : "#374151",
                  transition: "background 0.1s",
                }}>
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          {includeTime && !readOnly && selected && (
            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "0.875rem", paddingTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
              <span style={{ fontSize: "0.85rem" }}>🕐</span>
              <input type="number" min={0} max={23}
                value={selected.getHours()}
                onChange={e => changeTime("h", e.target.value)}
                style={{ width: 48, padding: "0.25rem", border: "1px solid #e2e8f0", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center" }} />
              <span style={{ fontWeight: "700", color: "#64748b" }}>:</span>
              <input type="number" min={0} max={59}
                value={selected.getMinutes()}
                onChange={e => changeTime("m", e.target.value)}
                style={{ width: 48, padding: "0.25rem", border: "1px solid #e2e8f0", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center" }} />
              <button onClick={() => setOpen(false)}
                style={{ marginLeft: "0.375rem", padding: "0.25rem 0.75rem", background: "var(--primary, #6366f1)", color: "white", border: "none", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>
                OK
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

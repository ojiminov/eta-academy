"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Student = { id: string; user: { firstName: string; lastName: string } };
type GroupStudent = { student: Student };
type Group = { id: string; name: string; groupStudents: GroupStudent[] };
type AttendanceRecord = { studentId: string; status: string };
type ClassSession = {
  id: string;
  scheduledAt: string;
  group: Group;
  attendances: AttendanceRecord[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT:     { label: "Present",      color: "#065f46", bg: "#d1fae5" },
  ABSENT:      { label: "Absent",       color: "#991b1b", bg: "#fee2e2" },
  LATE:        { label: "Late",         color: "#92400e", bg: "#fef3c7" },
  EXCUSED:     { label: "Excused",      color: "#1e40af", bg: "#dbeafe" },
  HOLIDAY:     { label: "Holiday",      color: "#4c1d95", bg: "#ede9fe" },
  HW_NOT_DONE: { label: "HW Not Done",  color: "#7c2d12", bg: "#ffedd5" },
};

export default function QRScanPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/teacher/sessions/today").then(r => r.json()).then((data: ClassSession[]) => {
      setSessions(data);
      if (data.length === 1) selectSession(data[0]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectSession(s: ClassSession) {
    setSelectedSession(s);
    // Build attendance map from existing records
    const map: Record<string, string> = {};
    s.group.groupStudents.forEach(gs => {
      const rec = s.attendances.find(a => a.studentId === gs.student.id);
      map[gs.student.id] = rec ? rec.status : "ABSENT";
    });
    setAttendance(map);
  }

  async function markAttendance(studentId: string, status: string) {
    if (!selectedSession) return;
    setSaving(studentId);
    try {
      const res = await fetch("/api/teacher/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSession.id, studentId, status }),
      });
      if (res.ok) {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
        showToast(`Marked as ${STATUS_CONFIG[status]?.label || status}`, true);
      }
    } finally {
      setSaving(null);
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const handleQRDetected = useCallback(async (studentId: string) => {
    if (!selectedSession) { showToast("Select a session first", false); return; }
    const found = selectedSession.group.groupStudents.find(gs => gs.student.id === studentId);
    if (!found) { showToast("Student not in this group", false); return; }
    if (attendance[studentId] === "PRESENT") { showToast("Already marked present", true); return; }
    await markAttendance(studentId, "PRESENT");
    setScanResult(`${found.student.user.firstName} ${found.student.user.lastName} — PRESENT ✅`);
    setTimeout(() => setScanResult(null), 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession, attendance]);

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);

      // Use BarcodeDetector if available, otherwise show manual fallback
      // @ts-expect-error BarcodeDetector not yet in TS types
      if (typeof BarcodeDetector !== "undefined") {
        // @ts-expect-error BarcodeDetector not yet in TS types
        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        scanInterval.current = setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue as string;
              const match = raw.match(/^ETA-STUDENT-(.+)$/);
              if (match) {
                await handleQRDetected(match[1]);
              }
            }
          } catch {
            // ignore detection errors
          }
        }, 500);
      } else {
        setCameraError("Your browser doesn't support automatic QR scanning. Use manual input below.");
      }
    } catch (err) {
      setCameraError("Camera access denied or not available. Use manual QR input instead.");
      console.error(err);
    }
  }

  function stopCamera() {
    if (scanInterval.current) clearInterval(scanInterval.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => { stopCamera(); }, []);

  async function handleManualScan() {
    const trimmed = manualInput.trim();
    const match = trimmed.match(/^ETA-STUDENT-(.+)$/);
    if (match) {
      await handleQRDetected(match[1]);
    } else {
      // Try as raw student ID
      await handleQRDetected(trimmed);
    }
    setManualInput("");
  }

  const students = selectedSession?.group.groupStudents.map(gs => gs.student) || [];
  const presentCount = Object.values(attendance).filter(s => s === "PRESENT").length;

  return (
    <div style={{ padding: "2rem", maxWidth: "960px" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "1.5rem", right: "1.5rem", padding: "0.75rem 1.25rem", background: toast.ok ? "#065f46" : "#991b1b", color: "white", borderRadius: "0.5rem", fontWeight: "600", zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>📷 QR Attendance Scanner</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Scan student QR codes or mark attendance manually</p>
      </div>

      {/* Session selector */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.75rem" }}>1. Select Today's Class Session</h2>
        {sessions.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No class sessions scheduled for today.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sessions.map(s => (
              <button key={s.id} onClick={() => selectSession(s)}
                style={{ padding: "0.75rem 1rem", textAlign: "left", background: selectedSession?.id === s.id ? "#ede9fe" : "#f8fafc", border: selectedSession?.id === s.id ? "2px solid #6366f1" : "1px solid #e2e8f0", borderRadius: "0.5rem", cursor: "pointer" }}>
                <div style={{ fontWeight: "600", color: "#1e293b" }}>{s.group.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {s.group.groupStudents.length} students
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSession && (
        <>
          {/* QR Scanner */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.75rem" }}>2. Scan QR Codes</h2>

            {scanResult && (
              <div style={{ padding: "0.75rem 1rem", background: "#d1fae5", borderRadius: "0.5rem", color: "#065f46", fontWeight: "600", marginBottom: "1rem" }}>
                ✅ {scanResult}
              </div>
            )}

            {/* Camera view */}
            <div style={{ position: "relative", background: "#0f172a", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "1rem", aspectRatio: "16/9", maxHeight: "300px" }}>
              <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
              {!scanning && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                  <div style={{ fontSize: "3rem" }}>📷</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Camera is off</div>
                </div>
              )}
              {scanning && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "180px", height: "180px", border: "3px solid #6366f1", borderRadius: "12px", boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }} />
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <button onClick={scanning ? stopCamera : startCamera}
                style={{ flex: 1, padding: "0.625rem 1rem", background: scanning ? "#ef4444" : "var(--primary, #6366f1)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600" }}>
                {scanning ? "⏹ Stop Camera" : "📷 Start Camera"}
              </button>
            </div>

            {cameraError && (
              <div style={{ padding: "0.625rem 0.875rem", background: "#fef3c7", borderRadius: "0.5rem", color: "#92400e", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                ⚠️ {cameraError}
              </div>
            )}

            {/* Manual QR input */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.375rem" }}>Or enter QR code / Student ID manually:</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={manualInput} onChange={e => setManualInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleManualScan()}
                  placeholder="ETA-STUDENT-... or student ID"
                  style={{ flex: 1, padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem" }} />
                <button onClick={handleManualScan}
                  style={{ padding: "0.5rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600" }}>
                  Mark Present
                </button>
              </div>
            </div>
          </div>

          {/* Attendance roster */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>3. Attendance Roster</h2>
              <span style={{ fontSize: "0.875rem", color: "#10b981", fontWeight: "600" }}>{presentCount}/{students.length} present</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Student", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => {
                  const st = attendance[student.id] || "ABSENT";
                  const cfg = STATUS_CONFIG[st] || { label: st, color: "#475569", bg: "#f1f5f9" };
                  return (
                    <tr key={student.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: "500", color: "#1e293b" }}>
                        {student.user.firstName} {student.user.lastName}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ padding: "0.25rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600", background: cfg.bg, color: cfg.color }}>
                          {saving === student.id ? "Saving…" : cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                          {Object.entries(STATUS_CONFIG).map(([status, c]) => (
                            <button key={status} onClick={() => markAttendance(student.id, status)}
                              disabled={saving === student.id}
                              style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", fontWeight: "600", background: st === status ? c.bg : "#f1f5f9", color: st === status ? c.color : "#64748b", border: st === status ? `1px solid ${c.color}40` : "1px solid #e2e8f0", borderRadius: "0.375rem", cursor: "pointer", transition: "all 0.1s" }}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

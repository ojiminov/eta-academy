"use client";

import { useEffect, useState } from "react";

export default function StudentQRPage() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/timetable")
      .then(r => r.json())
      .then(() => {
        // Get student info from session
        fetch("/api/auth/me")
          .then(r => r.json())
          .then(data => {
            setStudentId(data.studentId || data.id);
            setName(`${data.firstName || ""} ${data.lastName || ""}`.trim());
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem", color: "#94a3b8", textAlign: "center" }}>Loading your QR code…</div>;
  }

  return <QRDisplay studentId={studentId} name={name} />;
}

function QRDisplay({ studentId, name }: { studentId: string | null; name: string }) {
  // Use a reliable QR-code-as-image service
  const qrData = studentId ? `ETA-STUDENT-${studentId}` : null;
  const qrUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=280x280&margin=10&ecc=H`
    : null;

  return (
    <div style={{ padding: "2rem", maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>📱 My QR Code</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Show this to your teacher to mark attendance</p>
      </div>

      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        {/* QR Code */}
        {qrUrl ? (
          <div style={{ display: "inline-block", padding: "1rem", background: "white", borderRadius: "1rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: "1.25rem", border: "1px solid #e2e8f0" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="Student QR Code"
              width={280}
              height={280}
              style={{ display: "block", borderRadius: "0.5rem" }}
            />
          </div>
        ) : (
          <div style={{ width: 280, height: 280, background: "#f1f5f9", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "4rem" }}>
            ❓
          </div>
        )}

        {/* Student name */}
        <div style={{ fontWeight: "700", fontSize: "1.25rem", color: "#1e293b", marginBottom: "0.25rem" }}>
          {name || "Student"}
        </div>
        {studentId && (
          <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
            ID: {studentId}
          </div>
        )}

        {/* Instructions */}
        <div style={{ padding: "0.875rem 1rem", background: "#ede9fe", borderRadius: "0.75rem", textAlign: "left" }}>
          <div style={{ fontWeight: "600", color: "#4c1d95", fontSize: "0.875rem", marginBottom: "0.375rem" }}>How to use:</div>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", color: "#6d28d9", fontSize: "0.8rem", lineHeight: "1.6" }}>
            <li>Open this page before class</li>
            <li>Show the QR code to your teacher</li>
            <li>Teacher scans it to mark you present</li>
          </ol>
        </div>
      </div>

      {/* Brightness tip */}
      <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#fef3c7", borderRadius: "0.75rem", fontSize: "0.8rem", color: "#92400e" }}>
        💡 <strong>Tip:</strong> Turn up your screen brightness for easier scanning
      </div>
    </div>
  );
}

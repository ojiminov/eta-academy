export default function OfflinePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "#f8fafc", textAlign: "center" }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📡</div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#1e293b", marginBottom: "0.5rem" }}>You&apos;re Offline</h1>
      <p style={{ color: "#64748b", maxWidth: "340px", marginBottom: "2rem" }}>
        No internet connection. Please check your network and try again.
      </p>
      <button onClick={() => window.location.reload()} style={{ padding: "0.75rem 2rem", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: "0.75rem", fontWeight: "700", fontSize: "1rem", cursor: "pointer" }}>
        Try Again
      </button>
    </div>
  );
}

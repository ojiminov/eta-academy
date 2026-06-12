"use client";

import { useBranding } from "./BrandingProvider";

/**
 * Renders the academy logo as a large blurry watermark
 * centered in the content area (right of sidebar).
 * position:fixed + pointerEvents:none — never blocks clicks.
 */
export default function LogoWatermark() {
  const { logoUrl } = useBranding();
  if (!logoUrl) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        // Sidebar is ~240px; center watermark in the remaining content area
        left: "240px",
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={logoUrl}
        alt=""
        style={{
          width: "min(55vw, 520px)",
          height: "min(55vw, 520px)",
          objectFit: "contain",
          opacity: 0.07,
          filter: "blur(6px) saturate(0.4)",
          userSelect: "none",
          WebkitUserSelect: "none" as React.CSSProperties["WebkitUserSelect"],
          flexShrink: 0,
        }}
      />
    </div>
  );
}

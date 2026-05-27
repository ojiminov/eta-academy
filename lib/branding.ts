// Server-only: fetches academy branding from DB
// Used in root layout to inject CSS variables and pass to BrandingProvider

import { prisma } from "./prisma";

export type BrandingData = {
  name: string;
  logoUrl: string | null;
  logoName: string | null;
  primaryColor: string;
  primaryDark: string;
  primaryLight: string;  // subtle tint for backgrounds / focus rings
  sidebarBg: string;     // dark sidebar — same hue as primary, very low lightness
};

const DEFAULTS: BrandingData = {
  name: "ETA Academy",
  logoUrl: null,
  logoName: null,
  primaryColor: "#7C3AED",
  primaryDark: "#6D28D9",
  primaryLight: "#EDE9FE",
  sidebarBg: "#1E1040",
};

export async function getBranding(): Promise<BrandingData> {
  try {
    const s = await prisma.academySetting.findFirst({ where: { id: "singleton" } });
    if (!s) return DEFAULTS;
    const primary = s.primaryColor ?? "#6366f1";
    return {
      name:         s.name ?? "ETA Academy",
      logoUrl:      s.logoUrl ?? null,
      logoName:     s.logoName ?? null,
      primaryColor: primary,
      primaryDark:  shiftLightness(primary, -15),
      primaryLight: shiftLightness(primary, 40, 80),
      sidebarBg:    toSidebarBg(primary),
    };
  } catch {
    return DEFAULTS;
  }
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  if (c.length !== 6) return [250, 30, 12];
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else                h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const ll = l / 100, ss = s / 100;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Shift lightness by `delta`, optionally override saturation */
function shiftLightness(hex: string, delta: number, newS?: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, newS ?? s, Math.max(5, Math.min(95, l + delta)));
}

/** Dark sidebar: same hue as primary, desaturated, very dark */
function toSidebarBg(hex: string): string {
  const [h] = hexToHsl(hex);
  return hslToHex(h, 30, 11);
}

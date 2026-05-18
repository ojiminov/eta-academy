// Server-only: fetches academy branding from DB
// Used in root layout to inject CSS variables and pass to BrandingProvider

import { prisma } from "./prisma";

export type BrandingData = {
  name: string;
  logoUrl: string | null;
  logoName: string | null;
  primaryColor: string;
  primaryDark: string;
};

const DEFAULTS: BrandingData = {
  name: "ETA Academy",
  logoUrl: null,
  logoName: null,
  primaryColor: "#6366f1",
  primaryDark: "#4f46e5",
};

export async function getBranding(): Promise<BrandingData> {
  try {
    const s = await prisma.academySetting.findFirst({ where: { id: "singleton" } });
    if (!s) return DEFAULTS;
    const primary = s.primaryColor ?? "#6366f1";
    return {
      name: s.name ?? "ETA Academy",
      logoUrl: s.logoUrl ?? null,
      logoName: s.logoName ?? null,
      primaryColor: primary,
      primaryDark: darken(primary, 20),
    };
  } catch {
    return DEFAULTS;
  }
}

function darken(hex: string, amount = 20): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#4f46e5";
  const r = Math.max(0, parseInt(clean.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(clean.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(clean.slice(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

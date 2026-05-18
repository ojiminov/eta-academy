"use client";

import { createContext, useContext } from "react";

export type BrandingCtx = {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
};

const BrandingContext = createContext<BrandingCtx>({
  name: "ETA Academy",
  logoUrl: null,
  primaryColor: "#6366f1",
});

export function BrandingProvider({
  value,
  children,
}: {
  value: BrandingCtx;
  children: React.ReactNode;
}) {
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingCtx {
  return useContext(BrandingContext);
}

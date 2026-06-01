import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import PWAInit from "@/components/PWAInit";
import { BrandingProvider } from "@/components/BrandingProvider";
import { getBranding } from "@/lib/branding";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ETA Academy",
  description: "English Teaching Academy — student, teacher & admin portal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ETA Academy",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png",   sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png",   sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3d2d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale   = await getLocale();
  const messages = await getMessages();
  const branding = await getBranding();

  // Inject branding as CSS variables so every component using var(--primary) updates automatically
  const cssVars = {
    "--primary":          branding.primaryColor,
    "--primary-dark":     branding.primaryDark,
    "--primary-light":    branding.primaryLight,
    "--primary-gradient": `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryDark})`,
    "--sidebar-bg":       branding.sidebarBg,
  } as React.CSSProperties;

  return (
    <html lang={locale} className={`h-full ${jakartaSans.variable} ${playfair.variable}`} style={cssVars}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.x/dist/tabler-icons.min.css" />
      </head>
      <body className="min-h-full">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BrandingProvider value={{
            name: branding.name,
            logoUrl: branding.logoUrl,
            primaryColor: branding.primaryColor,
          }}>
            {children}
            <PWAInit />
          </BrandingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

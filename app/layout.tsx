import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import PWAInit from "@/components/PWAInit";
import "./globals.css";

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
  themeColor: "#16132a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,       // allow user zoom for accessibility
  userScalable: true,
  viewportFit: "cover",  // fills iPhone notch / home-bar area
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <PWAInit />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

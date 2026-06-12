import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LandingClient from "./LandingClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN")   redirect("/admin");
    if (session.role === "TEACHER") redirect("/teacher");
    if (session.role === "STUDENT") redirect("/student");
    if (session.role === "PARENT")  redirect("/parent");
    redirect("/login");
  }

  // Fetch settings for landing page (safe — no auth required for public read)
  let settings = null;
  try {
    settings = await prisma.academySetting.findFirst({ where: { id: "singleton" } });
  } catch { /* DB not ready — show defaults */ }

  return (
    <LandingClient
      academyName={settings?.name ?? "ETA Academy"}
      logoUrl={settings?.logoUrl ?? null}
      telegramUrl={(settings as { telegramUrl?: string | null } | null)?.telegramUrl ?? null}
      contactEmail={(settings as { contactEmail?: string | null } | null)?.contactEmail ?? null}
    />
  );
}

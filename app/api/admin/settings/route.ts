import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/settings — fetch academy branding (public read for layout)
export async function GET() {
  try {
    const s = await prisma.academySetting.findFirst({ where: { id: "singleton" } });
    return NextResponse.json(s ?? {
      id: "singleton",
      name: "ETA Academy",
      logoUrl: null,
      logoName: null,
      primaryColor: "var(--primary, #6366f1)",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/settings — update academy branding (admin only)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { name, logoUrl, logoName, primaryColor } = await req.json();

    const updated = await prisma.academySetting.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        name:         name         ?? "ETA Academy",
        logoUrl:      logoUrl      ?? null,
        logoName:     logoName     ?? null,
        primaryColor: primaryColor ?? "var(--primary, #6366f1)",
      },
      update: {
        ...(name         !== undefined && { name }),
        ...(logoUrl      !== undefined && { logoUrl }),
        ...(logoName     !== undefined && { logoName }),
        ...(primaryColor !== undefined && { primaryColor }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

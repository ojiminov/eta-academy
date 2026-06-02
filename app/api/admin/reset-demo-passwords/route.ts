import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hash = await bcrypt.hash("student123", 10);

  const result = await prisma.user.updateMany({
    where: { role: "STUDENT" },
    data: { passwordHash: hash, isActive: true },
  });

  return NextResponse.json({ success: true, updated: result.count });
}

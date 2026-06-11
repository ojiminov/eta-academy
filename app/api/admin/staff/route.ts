import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, role, monthlySalary, phone } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const staff = await prisma.staff.create({
    data: { name, role: role || "staff", monthlySalary: Number(monthlySalary) || 0, phone },
  });
  return NextResponse.json(staff, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, role, monthlySalary, phone } = await req.json();
  const staff = await prisma.staff.update({
    where: { id },
    data: { name, role, monthlySalary: Number(monthlySalary), phone },
  });
  return NextResponse.json(staff);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.staff.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

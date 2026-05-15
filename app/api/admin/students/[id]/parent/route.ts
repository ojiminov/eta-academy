import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
function newId() { return randomBytes(12).toString("base64url"); }

// POST: create a parent account for a student
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: studentId } = await params;
    const { email, password, firstName, lastName, phone } = await req.json();
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // Check student exists
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { parent: true } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    if (student.parent) return NextResponse.json({ error: "Parent account already exists for this student" }, { status: 409 });

    // Check email not taken
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        id: newId(),
        email: email.toLowerCase(),
        passwordHash,
        role: "PARENT",
        firstName,
        lastName,
        phone: phone || null,
        parent: {
          create: { id: newId(), studentId },
        },
      },
      include: { parent: true },
    });

    return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

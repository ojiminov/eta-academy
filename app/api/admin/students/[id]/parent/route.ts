import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
function newId() { return randomBytes(12).toString("base64url"); }

// POST: create or link a parent account to a student
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: studentId } = await params;
    const { email, password, firstName, lastName, phone } = await req.json();
    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // Check student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Check if user with this email already exists (could be linking an existing parent)
    let parentUserId: string;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (existing) {
      if (existing.role !== "PARENT") {
        return NextResponse.json({ error: "Email belongs to a non-parent account" }, { status: 409 });
      }
      parentUserId = existing.id;
    } else {
      if (!password) return NextResponse.json({ error: "Password required for new parent account" }, { status: 400 });
      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = await prisma.user.create({
        data: {
          id: newId(),
          email: email.toLowerCase(),
          passwordHash,
          role: "PARENT",
          firstName,
          lastName,
          phone: phone || null,
          parent: { create: { id: newId() } },
        },
      });
      parentUserId = newUser.id;
    }

    // Get or create the parent record
    const parent = await prisma.parent.findFirst({ where: { userId: parentUserId } });
    if (!parent) return NextResponse.json({ error: "Parent record not found" }, { status: 500 });

    // Link parent to student (ignore if already linked)
    await prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: parent.id, studentId } },
      create: { id: newId(), parentId: parent.id, studentId },
      update: {},
    });

    return NextResponse.json({ success: true, parentId: parent.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

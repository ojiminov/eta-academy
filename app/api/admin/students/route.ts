import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        groupStudents: {
          where: { isActive: true },
          include: {
            group: {
              select: {
                name: true,
                teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
              },
            },
          },
        },
      },
      orderBy: { user: { lastName: "asc" } },
    });
    return NextResponse.json(students);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { firstName, lastName, email, password, phone, englishLevel, parentName, parentPhone } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: "STUDENT",
        firstName,
        lastName,
        phone: phone || null,
        student: {
          create: {
            englishLevel: englishLevel || "BEGINNER",
            parentName: parentName || null,
            parentPhone: parentPhone || null,
          },
        },
      },
      include: { student: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
function newId() { return randomBytes(12).toString("base64url"); }

// GET /api/teacher/materials — list course materials for this teacher
export async function GET() {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const teacher = await prisma.teacher.findFirst({ where: { userId: session.userId } });
    const where = session.role === "TEACHER" && teacher
      ? { teacherId: teacher.id }
      : {};
    const materials = await prisma.courseMaterial.findMany({
      where,
      include: { group: true, teacher: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(materials);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/teacher/materials — upload a new course material
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { groupId, title, description, fileUrl, fileName, fileSize, fileType } = await req.json();
    if (!title || !fileUrl || !fileName) {
      return NextResponse.json({ error: "title, fileUrl and fileName required" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({ where: { userId: session.userId } });
    if (!teacher && session.role === "TEACHER") {
      return NextResponse.json({ error: "Teacher record not found" }, { status: 404 });
    }

    const material = await prisma.courseMaterial.create({
      data: {
        id: newId(),
        teacherId: teacher!.id,
        groupId: groupId || null,
        title,
        description: description || null,
        fileUrl,
        fileName,
        fileSize: fileSize ? parseInt(fileSize) : null,
        fileType: fileType || null,
      },
      include: { group: true, teacher: { include: { user: true } } },
    });
    return NextResponse.json(material, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/teacher/materials?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const teacher = await prisma.teacher.findFirst({ where: { userId: session.userId } });
    const material = await prisma.courseMaterial.findFirst({
      where: session.role === "TEACHER"
        ? { id, teacherId: teacher!.id }
        : { id },
    });
    if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.courseMaterial.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

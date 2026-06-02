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

  const results: string[] = [];

  try {
    // ── Demo Student ──────────────────────────────────────────────────────
    const existingStudent = await prisma.user.findUnique({ where: { email: "demo.student@eta.uz" } });
    if (existingStudent) {
      results.push("demo.student@eta.uz already exists — skipped");
    } else {
      const demoStudentUser = await prisma.user.create({
        data: {
          email: "demo.student@eta.uz",
          passwordHash: await bcrypt.hash("demo123", 10),
          role: "STUDENT",
          firstName: "Demo",
          lastName: "Student",
        },
      });
      const demoStudent = await prisma.student.create({
        data: {
          userId: demoStudentUser.id,
          englishLevel: "INTERMEDIATE",
          dateOfBirth: new Date("2003-05-01"),
          parentName: "Demo Parent",
          parentPhone: "+998 90 000 00 01",
        },
      });

      // Enroll in the first available active group
      const firstGroup = await prisma.group.findFirst({ orderBy: { createdAt: "asc" } });
      if (firstGroup) {
        await prisma.groupStudent.create({
          data: { groupId: firstGroup.id, studentId: demoStudent.id, joinedAt: new Date() },
        });
      }

      results.push("✅ demo.student@eta.uz / demo123 created");
    }

    // ── Demo Teacher ──────────────────────────────────────────────────────
    const existingTeacher = await prisma.user.findUnique({ where: { email: "demo.teacher@eta.uz" } });
    if (existingTeacher) {
      results.push("demo.teacher@eta.uz already exists — skipped");
    } else {
      const demoTeacherUser = await prisma.user.create({
        data: {
          email: "demo.teacher@eta.uz",
          passwordHash: await bcrypt.hash("demo123", 10),
          role: "TEACHER",
          firstName: "Demo",
          lastName: "Teacher",
          phone: "+998 90 000 00 02",
        },
      });
      await prisma.teacher.create({
        data: {
          userId: demoTeacherUser.id,
          bio: "Demo teacher account for portal preview",
          subjects: ["General English"],
        },
      });
      results.push("✅ demo.teacher@eta.uz / demo123 created");
    }

    // ── Demo Parent ───────────────────────────────────────────────────────
    const existingParent = await prisma.user.findUnique({ where: { email: "demo.parent@eta.uz" } });
    if (existingParent) {
      results.push("demo.parent@eta.uz already exists — skipped");
    } else {
      // Link to demo student if exists
      const demoStudentRecord = await prisma.user.findUnique({
        where: { email: "demo.student@eta.uz" },
        include: { student: true },
      });

      if (demoStudentRecord?.student) {
        await prisma.user.create({
          data: {
            email: "demo.parent@eta.uz",
            passwordHash: await bcrypt.hash("demo123", 10),
            role: "PARENT",
            firstName: "Demo",
            lastName: "Parent",
            parent: {
              create: { studentId: demoStudentRecord.student.id },
            },
          },
        });
        results.push("✅ demo.parent@eta.uz / demo123 created");
      } else {
        results.push("⚠️ demo.parent@eta.uz skipped — demo student not found");
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

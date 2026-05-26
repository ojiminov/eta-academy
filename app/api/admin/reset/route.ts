import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DIRECT_URL });

  try {
    // ── 1. Wipe all data tables (CASCADE handles child rows) ──────────────────
    await pool.query(`
      TRUNCATE TABLE
        coin_transactions,
        homework_grades,
        exam_results,
        attendances,
        grades,
        class_sessions,
        homeworks,
        exams,
        course_materials,
        group_students,
        invoices,
        payments,
        groups,
        student_documents,
        parents,
        messages,
        notifications,
        announcements,
        expenses,
        leads,
        students,
        teachers,
        users
      CASCADE;
    `);

    // Reset academy branding to defaults
    await pool.query(`
      UPDATE academy_settings
      SET name = 'ETA Academy', "logoUrl" = NULL, "logoName" = NULL,
          "primaryColor" = '#6366f1', "updatedAt" = NOW()
      WHERE id = 'singleton';
    `);

    // ── 2. Hash passwords ─────────────────────────────────────────────────────
    const [adminHash, teacherHash, studentHash] = await Promise.all([
      bcrypt.hash("admin123", 10),
      bcrypt.hash("teacher123", 10),
      bcrypt.hash("student123", 10),
    ]);

    // ── 3. IDs ────────────────────────────────────────────────────────────────
    const adminUserId   = randomUUID();
    const teacherUserId = randomUUID();
    const teacherId     = randomUUID();
    const s1UserId = randomUUID(); const s1Id = randomUUID();
    const s2UserId = randomUUID(); const s2Id = randomUUID();
    const s3UserId = randomUUID(); const s3Id = randomUUID();

    // ── 4. Admin ──────────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO users (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
      VALUES ($1, 'admin@eta.uz', $2, 'ADMIN', 'Sample', 'Admin', true, NOW(), NOW())
    `, [adminUserId, adminHash]);

    // ── 5. Teacher ────────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO users (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
      VALUES ($1, 'teacher@eta.uz', $2, 'TEACHER', 'Sample', 'Teacher', true, NOW(), NOW())
    `, [teacherUserId, teacherHash]);

    await pool.query(`
      INSERT INTO teachers (id, "userId", subjects, "createdAt", "updatedAt")
      VALUES ($1, $2, '{}', NOW(), NOW())
    `, [teacherId, teacherUserId]);

    // ── 6. Students ───────────────────────────────────────────────────────────
    const students = [
      { userId: s1UserId, id: s1Id, email: "sample1@student.uz", last: "Student One"   },
      { userId: s2UserId, id: s2Id, email: "sample2@student.uz", last: "Student Two"   },
      { userId: s3UserId, id: s3Id, email: "sample3@student.uz", last: "Student Three" },
    ];

    for (const s of students) {
      await pool.query(`
        INSERT INTO users (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'STUDENT', 'Sample', $4, true, NOW(), NOW())
      `, [s.userId, s.email, studentHash, s.last]);

      await pool.query(`
        INSERT INTO students (
          id, "userId", status, "englishLevel", balance, "discountPercent",
          "totalCoins", "currentStreak", "longestStreak", badge, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, 'ACTIVE', 'BEGINNER', 0, 0, 0, 0, 0, 'BRONZE', NOW(), NOW())
      `, [s.id, s.userId]);
    }

    return NextResponse.json({
      success: true,
      message: "Database wiped and re-seeded successfully.",
      accounts: {
        admin:   { email: "admin@eta.uz",    password: "admin123"   },
        teacher: { email: "teacher@eta.uz",  password: "teacher123" },
        students: [
          { email: "sample1@student.uz", password: "student123" },
          { email: "sample2@student.uz", password: "student123" },
          { email: "sample3@student.uz", password: "student123" },
        ],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await pool.end();
  }
}

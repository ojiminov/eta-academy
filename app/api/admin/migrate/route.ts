import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

const SQL = `
DO $$ BEGIN CREATE TYPE "StudentStatus" AS ENUM ('LEAD','TRIAL','ACTIVE','GRADUATE','INACTIVE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MarketingSource" AS ENUM ('INSTAGRAM','TELEGRAM','FACEBOOK','REFERRAL','WALK_IN','WEBSITE','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ExpenseCategory" AS ENUM ('RENT','SALARIES','UTILITIES','MARKETING','SUPPLIES','EQUIPMENT','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "HomeworkStatus" AS ENUM ('ASSIGNED','SUBMITTED','GRADED','LATE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "NotificationType" AS ENUM ('INFO','WARNING','PAYMENT','ATTENDANCE','HOMEWORK','EXAM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PARENT';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'HOLIDAY';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'HW_NOT_DONE';

ALTER TABLE students ADD COLUMN IF NOT EXISTS status "StudentStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE students ADD COLUMN IF NOT EXISTS balance DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pinfl TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "contractNumber" TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "marketingSource" "MarketingSource";
ALTER TABLE students ADD COLUMN IF NOT EXISTS "enrollmentDate" TIMESTAMP(3);

ALTER TABLE groups ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS room TEXT;

CREATE TABLE IF NOT EXISTS parents (
  id TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE, "studentId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT NOT NULL PRIMARY KEY, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL,
  phone TEXT NOT NULL, email TEXT, source "MarketingSource" NOT NULL DEFAULT 'OTHER',
  status "StudentStatus" NOT NULL DEFAULT 'LEAD', "interestedLevel" "EnglishLevel",
  "trialDate" TIMESTAMP(3), notes TEXT, "convertedToStudentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homeworks (
  id TEXT NOT NULL PRIMARY KEY, "groupId" TEXT NOT NULL, "teacherId" TEXT NOT NULL,
  title TEXT NOT NULL, description TEXT, "dueDate" TIMESTAMP(3) NOT NULL,
  "returnDate" TIMESTAMP(3), "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("groupId") REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY ("teacherId") REFERENCES teachers(id)
);

CREATE TABLE IF NOT EXISTS homework_grades (
  id TEXT NOT NULL PRIMARY KEY, "homeworkId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
  status "HomeworkStatus" NOT NULL DEFAULT 'ASSIGNED', score DOUBLE PRECISION,
  feedback TEXT, "submittedAt" TIMESTAMP(3), "gradedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("homeworkId") REFERENCES homeworks(id) ON DELETE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE ("homeworkId", "studentId")
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT NOT NULL PRIMARY KEY, "groupId" TEXT NOT NULL, "teacherId" TEXT NOT NULL,
  title TEXT NOT NULL, description TEXT, "scheduledAt" TIMESTAMP(3) NOT NULL,
  duration INTEGER, "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("groupId") REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY ("teacherId") REFERENCES teachers(id)
);

CREATE TABLE IF NOT EXISTS exam_results (
  id TEXT NOT NULL PRIMARY KEY, "examId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
  score DOUBLE PRECISION, feedback TEXT, "gradedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("examId") REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE ("examId", "studentId")
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT NOT NULL PRIMARY KEY, title TEXT NOT NULL, amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UZS', category "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
  description TEXT, date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL,
  type "NotificationType" NOT NULL DEFAULT 'INFO', title TEXT NOT NULL, body TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false, link TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT NOT NULL PRIMARY KEY, "senderId" TEXT NOT NULL, "receiverId" TEXT NOT NULL,
  body TEXT NOT NULL, "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("senderId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("receiverId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_documents (
  id TEXT NOT NULL PRIMARY KEY, "studentId" TEXT NOT NULL, name TEXT NOT NULL,
  url TEXT NOT NULL, "fileType" TEXT, "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE
);

DO $$ BEGIN CREATE TYPE "BadgeTier" AS ENUM ('BRONZE','SILVER','GOLD','PLATINUM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CoinType" AS ENUM ('ATTENDANCE','HOMEWORK','EXAM','STREAK','BONUS'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE students ADD COLUMN IF NOT EXISTS "totalCoins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS badge "BadgeTier" NOT NULL DEFAULT 'BRONZE';

ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
UPDATE users SET "isActive" = true WHERE "isActive" = false OR "isActive" IS NULL;

CREATE TABLE IF NOT EXISTS coin_transactions (
  id TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type "CoinType" NOT NULL,
  reason TEXT NOT NULL,
  "refId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE
);

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS "sharePercent" DOUBLE PRECISION NOT NULL DEFAULT 50;
ALTER TABLE group_students ADD COLUMN IF NOT EXISTS "hasBook" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS "cashAmount" DOUBLE PRECISION;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS "cardAmount" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS teacher_advances (
  id TEXT NOT NULL PRIMARY KEY,
  "teacherId" TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  reason TEXT,
  date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("teacherId") REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teacher_fines (
  id TEXT NOT NULL PRIMARY KEY,
  "teacherId" TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  reason TEXT,
  date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("teacherId") REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  "monthlySalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
  phone TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Task 2: Group-centered payments + enrollment period tracking ───────────────
-- Add groupId, month, year to payments for direct group context on every payment
ALTER TABLE payments ADD COLUMN IF NOT EXISTS "groupId" TEXT REFERENCES groups(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS month INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS year INTEGER;

-- Back-fill groupId/month/year from existing Invoice links (safe UPDATE, no data loss)
UPDATE payments p
SET "groupId" = i."groupId", month = i.month, year = i.year
FROM invoices i
WHERE p."invoiceId" = i.id AND p."groupId" IS NULL;

-- Index for fast group+month+year payment queries (payroll, per-group reports)
CREATE INDEX IF NOT EXISTS idx_payments_group_month_year ON payments ("groupId", month, year);

-- Add leftAt to group_students to track enrollment end dates
ALTER TABLE group_students ADD COLUMN IF NOT EXISTS "leftAt" TIMESTAMP(3);

-- ── Task 3: Parent many-to-many ───────────────────────────────────────────────
-- Create parent_students join table (one parent → many children)
CREATE TABLE IF NOT EXISTS parent_students (
  id TEXT NOT NULL PRIMARY KEY,
  "parentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("parentId") REFERENCES parents(id) ON DELETE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE ("parentId", "studentId")
);

CREATE INDEX IF NOT EXISTS idx_parent_students_parent ON parent_students ("parentId");
CREATE INDEX IF NOT EXISTS idx_parent_students_student ON parent_students ("studentId");

-- Migrate any existing parent→student links (only if studentId column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parents' AND column_name = 'studentId'
  ) THEN
    INSERT INTO parent_students (id, "parentId", "studentId", "createdAt")
    SELECT gen_random_uuid()::text, id, "studentId", "createdAt"
    FROM parents
    WHERE "studentId" IS NOT NULL
    ON CONFLICT ("parentId", "studentId") DO NOTHING;

    ALTER TABLE parents DROP COLUMN "studentId";
  END IF;
END $$;

ALTER TABLE academy_settings ADD COLUMN IF NOT EXISTS "telegramUrl" TEXT;
ALTER TABLE academy_settings ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
`;

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  try {
    await pool.query(SQL);
    return NextResponse.json({ success: true, message: "Migration applied successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await pool.end();
  }
}

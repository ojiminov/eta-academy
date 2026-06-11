import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const SEED_MONTH = 5;
const SEED_YEAR = 2026;

const TEACHERS = [
  { firstName: "Abdusattor", lastName: "Usmonov",  email: "abdusattor@discover.uz", sharePercent: 50 },
  { firstName: "Doniyor",    lastName: "Ismoilov", email: "doniyor@discover.uz",    sharePercent: 73 },
  { firstName: "Bekzod",     lastName: "Nazarov",  email: "bekzod@discover.uz",     sharePercent: 50 },
  { firstName: "Shahnoza",   lastName: "Umarova",  email: "shahnoza@discover.uz",   sharePercent: 50 },
  { firstName: "Oisha",      lastName: "Karimova", email: "oisha@discover.uz",      sharePercent: 50 },
  { firstName: "Elbek",      lastName: "Toshmatov",email: "elbek@discover.uz",      sharePercent: 50 },
  { firstName: "Navruz",     lastName: "Ergashev", email: "navruz@discover.uz",     sharePercent: 50 },
  { firstName: "Dilafruz",   lastName: "Rahimova", email: "dilafruz@discover.uz",   sharePercent: 70 },
];

const GROUPS = [
  { name: "Pre Ab2",       teacherEmail: "abdusattor@discover.uz", students: 8,  monthlyFee: 256250, level: "PRE_INTERMEDIATE", schedule: "Sesh/Pay/Shanba", collectedCash: 1750000, collectedCard: 300000 },
  { name: "Inter Ab2",     teacherEmail: "abdusattor@discover.uz", students: 7,  monthlyFee: 335714, level: "INTERMEDIATE",     schedule: "Dush/Chor/Juma",  collectedCash: 2350000, collectedCard: 0 },
  { name: "Beginner Ab2",  teacherEmail: "abdusattor@discover.uz", students: 4,  monthlyFee: 187500, level: "BEGINNER",         schedule: "Sesh/Pay/Shanba", collectedCash: 750000,  collectedCard: 0 },
  { name: "Kids Ab1",      teacherEmail: "abdusattor@discover.uz", students: 11, monthlyFee: 227272, level: "BEGINNER",         schedule: "Dush/Chor/Juma",  collectedCash: 2250000, collectedCard: 250000 },
  { name: "Kids Ab2",      teacherEmail: "abdusattor@discover.uz", students: 5,  monthlyFee: 320000, level: "BEGINNER",         schedule: "Sesh/Pay/Shanba", collectedCash: 1200000, collectedCard: 400000 },
  { name: "Kids Ab3",      teacherEmail: "abdusattor@discover.uz", students: 12, monthlyFee: 241666, level: "BEGINNER",         schedule: "Dush/Chor/Juma",  collectedCash: 2900000, collectedCard: 0 },
  { name: "Kids Ab4",      teacherEmail: "abdusattor@discover.uz", students: 17, monthlyFee: 244117, level: "BEGINNER",         schedule: "Sesh/Pay/Shanba", collectedCash: 3650000, collectedCard: 500000 },
  { name: "Doniyor guruhi",teacherEmail: "doniyor@discover.uz",    students: 21, monthlyFee: 305952, level: "INTERMEDIATE",     schedule: "Sesh/Pay/Shanba", collectedCash: 4245000, collectedCard: 1305000 },
  { name: "Bekzod guruhi", teacherEmail: "bekzod@discover.uz",     students: 25, monthlyFee: 186800, level: "ELEMENTARY",       schedule: "Dush/Chor/Juma",  collectedCash: 3220000, collectedCard: 250000 },
  { name: "Rus tili N",    teacherEmail: "shahnoza@discover.uz",   students: 15, monthlyFee: 241000, level: "BEGINNER",         schedule: "Dush/Chor/Juma",  collectedCash: 2295000, collectedCard: 770000 },
  { name: "Oisha guruhi",  teacherEmail: "oisha@discover.uz",      students: 12, monthlyFee: 202916, level: "ELEMENTARY",       schedule: "Dush/Chor/Juma",  collectedCash: 1935000, collectedCard: 500000 },
  { name: "Elbek guruhi",  teacherEmail: "elbek@discover.uz",      students: 13, monthlyFee: 211538, level: "ELEMENTARY",       schedule: "Dush/Chor/Juma",  collectedCash: 1850000, collectedCard: 300000 },
  { name: "Navruz guruhi", teacherEmail: "navruz@discover.uz",     students: 9,  monthlyFee: 283333, level: "ELEMENTARY",       schedule: "Sesh/Pay/Shanba", collectedCash: 1750000, collectedCard: 200000 },
  { name: "Dilafruz guruhi",teacherEmail:"dilafruz@discover.uz",   students: 5,  monthlyFee: 260000, level: "ELEMENTARY",       schedule: "Sesh/Pay/Shanba", collectedCash: 1050000, collectedCard: 250000 },
];

// avans entries only (not oylik/arenda/konstavar)
const ADVANCES = [
  { teacherEmail: "abdusattor@discover.uz", amount: 500000,  reason: "avans", date: "2026-05-13" },
  { teacherEmail: "abdusattor@discover.uz", amount: 500000,  reason: "avans", date: "2026-05-15" },
  { teacherEmail: "abdusattor@discover.uz", amount: 200000,  reason: "avans", date: "2026-05-21" },
  { teacherEmail: "abdusattor@discover.uz", amount: 1800000, reason: "avans", date: "2026-05-25" },
  { teacherEmail: "abdusattor@discover.uz", amount: 600000,  reason: "avans", date: "2026-05-29" },
  { teacherEmail: "doniyor@discover.uz",    amount: 1000000, reason: "avans", date: "2026-05-10" },
  { teacherEmail: "doniyor@discover.uz",    amount: 500000,  reason: "avans", date: "2026-05-15" },
  { teacherEmail: "doniyor@discover.uz",    amount: 650000,  reason: "avans", date: "2026-05-18" },
  { teacherEmail: "doniyor@discover.uz",    amount: 300000,  reason: "avans", date: "2026-05-22" },
  { teacherEmail: "doniyor@discover.uz",    amount: 100000,  reason: "avans", date: "2026-05-23" },
  { teacherEmail: "doniyor@discover.uz",    amount: 300000,  reason: "avans", date: "2026-05-26" },
  { teacherEmail: "bekzod@discover.uz",     amount: 100000,  reason: "avans", date: "2026-05-07" },
  { teacherEmail: "bekzod@discover.uz",     amount: 1000000, reason: "avans", date: "2026-05-08" },
  { teacherEmail: "bekzod@discover.uz",     amount: 600000,  reason: "avans", date: "2026-05-14" },
  { teacherEmail: "bekzod@discover.uz",     amount: 100000,  reason: "avans", date: "2026-05-15" },
  { teacherEmail: "shahnoza@discover.uz",   amount: 100000,  reason: "avans", date: "2026-05-15" },
  { teacherEmail: "oisha@discover.uz",      amount: 450000,  reason: "avans", date: "2026-05-18" },
  { teacherEmail: "elbek@discover.uz",      amount: 300000,  reason: "avans", date: "2026-05-15" },
  { teacherEmail: "elbek@discover.uz",      amount: 600000,  reason: "avans", date: "2026-05-20" },
  { teacherEmail: "elbek@discover.uz",      amount: 100000,  reason: "avans", date: "2026-05-26" },
  { teacherEmail: "navruz@discover.uz",     amount: 600000,  reason: "avans", date: "2026-05-26" },
  { teacherEmail: "dilafruz@discover.uz",   amount: 100000,  reason: "avans", date: "2026-05-14" },
  { teacherEmail: "dilafruz@discover.uz",   amount: 400000,  reason: "avans", date: "2026-05-15" },
];

const FINES = [
  { teacherEmail: "abdusattor@discover.uz", amount: 40000, reason: "20 minut kech keldi", date: "2026-05-05" },
  { teacherEmail: "abdusattor@discover.uz", amount: 30000, reason: "15 minut kech keldi", date: "2026-05-08" },
  { teacherEmail: "abdusattor@discover.uz", amount: 30000, reason: "16 minut kech keldi", date: "2026-05-12" },
  { teacherEmail: "abdusattor@discover.uz", amount: 40000, reason: "20 minut kech keldi", date: "2026-05-15" },
  { teacherEmail: "abdusattor@discover.uz", amount: 60000, reason: "30 minut kech keldi", date: "2026-05-16" },
  { teacherEmail: "abdusattor@discover.uz", amount: 60000, reason: "31 minut kech keldi", date: "2026-05-25" },
];

const STAFF_SEED = [
  { name: "Shahnoza Opa", role: "secretary",  monthlySalary: 2000000, phone: "" },
  { name: "Fotima Opa",   role: "accountant", monthlySalary: 700000,  phone: "" },
];

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];
  const teacherPwHash = await bcrypt.hash("teacher123", 10);
  const studentPwHash = await bcrypt.hash("student123", 10);

  try {
    // ── 1. Teachers ──────────────────────────────────────────────────────────
    const teacherMap: Record<string, string> = {}; // email → teacherId

    for (const t of TEACHERS) {
      let user = await prisma.user.findUnique({ where: { email: t.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: t.email,
            passwordHash: teacherPwHash,
            firstName: t.firstName,
            lastName: t.lastName,
            role: "TEACHER",
            isActive: true,
          },
        });
        log.push(`Created user: ${t.firstName} ${t.lastName}`);
      }

      let teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
      if (!teacher) {
        teacher = await prisma.teacher.create({
          data: { userId: user.id, sharePercent: t.sharePercent },
        });
        log.push(`Created teacher record: ${t.firstName}`);
      } else {
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { sharePercent: t.sharePercent },
        });
      }
      teacherMap[t.email] = teacher.id;
    }

    // ── 2. Groups + Invoices + Payments ──────────────────────────────────────
    for (const g of GROUPS) {
      const teacherId = teacherMap[g.teacherEmail];
      if (!teacherId) { log.push(`⚠ No teacher for ${g.name}`); continue; }

      // Group
      let group = await prisma.group.findFirst({ where: { name: g.name, teacherId } });
      if (!group) {
        group = await prisma.group.create({
          data: {
            name: g.name,
            teacherId,
            level: g.level as "BEGINNER" | "ELEMENTARY" | "PRE_INTERMEDIATE" | "INTERMEDIATE" | "UPPER_INTERMEDIATE" | "ADVANCED",
            schedule: g.schedule,
            maxStudents: g.students + 3,
            monthlyFee: g.monthlyFee,
            startDate: new Date("2025-09-01"),
            isActive: true,
          },
        });
        log.push(`Created group: ${g.name}`);
      }

      // Invoice for May 2026
      const invoiceWhere = { groupId_month_year: { groupId: group.id, month: SEED_MONTH, year: SEED_YEAR } };
      let invoice = await prisma.invoice.findUnique({ where: invoiceWhere });
      if (!invoice) {
        const shouldCollect = g.collectedCash + g.collectedCard;
        invoice = await prisma.invoice.create({
          data: {
            groupId: group.id,
            month: SEED_MONTH,
            year: SEED_YEAR,
            amount: shouldCollect,
            dueDate: new Date(`${SEED_YEAR}-${SEED_MONTH}-05`),
          },
        });
        log.push(`Created invoice: ${g.name} May ${SEED_YEAR}`);
      }

      // Placeholder student (represents bulk group collection)
      const studentEmail = `pay.${g.name.toLowerCase().replace(/[\s/]+/g, ".")}@discover.uz`;
      let studentUser = await prisma.user.findUnique({ where: { email: studentEmail } });
      let student;
      if (!studentUser) {
        studentUser = await prisma.user.create({
          data: {
            email: studentEmail,
            passwordHash: studentPwHash,
            firstName: g.name,
            lastName: "guruhi",
            role: "STUDENT",
            isActive: true,
          },
        });
        student = await prisma.student.create({
          data: { userId: studentUser.id, status: "ACTIVE" },
        });
        await prisma.groupStudent.create({
          data: { groupId: group.id, studentId: student.id, isActive: true },
        });
        log.push(`Created placeholder student for: ${g.name}`);
      } else {
        student = await prisma.student.findUnique({ where: { userId: studentUser.id } });
      }

      if (!student) { log.push(`⚠ No student for ${g.name}`); continue; }

      // Payment
      const existingPay = await prisma.payment.findFirst({
        where: { studentId: student.id, invoiceId: invoice.id },
      });
      if (!existingPay) {
        const collected = g.collectedCash + g.collectedCard;
        await prisma.payment.create({
          data: {
            studentId: student.id,
            invoiceId: invoice.id,
            amount: collected,
            cashAmount: g.collectedCash > 0 ? g.collectedCash : null,
            cardAmount: g.collectedCard > 0 ? g.collectedCard : null,
            status: "PAID",
            paidAt: new Date(`${SEED_YEAR}-05-31`),
            method: g.collectedCard > 0 ? "mixed" : "cash",
          },
        });
        log.push(`Recorded payment ${(collected / 1000000).toFixed(2)}M for ${g.name}`);
      }
    }

    // ── 3. Teacher Advances ───────────────────────────────────────────────────
    let advCount = 0;
    for (const a of ADVANCES) {
      const teacherId = teacherMap[a.teacherEmail];
      if (!teacherId) continue;
      const exists = await prisma.teacherAdvance.findFirst({
        where: { teacherId, amount: a.amount, date: new Date(a.date) },
      });
      if (!exists) {
        await prisma.teacherAdvance.create({
          data: { teacherId, amount: a.amount, reason: a.reason, date: new Date(a.date) },
        });
        advCount++;
      }
    }
    log.push(`Created ${advCount} teacher advance records`);

    // ── 4. Teacher Fines ──────────────────────────────────────────────────────
    let fineCount = 0;
    for (const f of FINES) {
      const teacherId = teacherMap[f.teacherEmail];
      if (!teacherId) continue;
      const exists = await prisma.teacherFine.findFirst({
        where: { teacherId, amount: f.amount, date: new Date(f.date) },
      });
      if (!exists) {
        await prisma.teacherFine.create({
          data: { teacherId, amount: f.amount, reason: f.reason, date: new Date(f.date) },
        });
        fineCount++;
      }
    }
    log.push(`Created ${fineCount} teacher fine records`);

    // ── 5. Non-teaching Staff ─────────────────────────────────────────────────
    for (const s of STAFF_SEED) {
      const exists = await prisma.staff.findFirst({ where: { name: s.name } });
      if (!exists) {
        await prisma.staff.create({ data: s });
        log.push(`Created staff: ${s.name}`);
      }
    }

    return NextResponse.json({ success: true, log });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, log }, { status: 500 });
  }
}

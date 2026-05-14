import { PrismaClient, Role, EnglishLevel, PaymentStatus, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ETA Academy database...");

  // Clean existing data
  await prisma.attendance.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.groupStudent.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.group.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // ─── ADMIN ───────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@eta.uz",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: Role.ADMIN,
      firstName: "Sarvar",
      lastName: "Yusupov",
      phone: "+998 90 123 45 67",
    },
  });
  console.log(`✅ Admin: ${adminUser.email}`);

  // ─── TEACHERS ─────────────────────────────────────────────────────────
  const teacherData = [
    { firstName: "Dilnoza", lastName: "Karimova", email: "dilnoza@eta.uz", phone: "+998 90 234 56 78", bio: "Native-level English, 8 years teaching experience", subjects: ["General English", "Business English"] },
    { firstName: "Jasur",   lastName: "Toshmatov", email: "jasur@eta.uz",   phone: "+998 90 345 67 89", bio: "CELTA certified, specialises in exam prep (IELTS, TOEFL)", subjects: ["IELTS Prep", "Academic English"] },
    { firstName: "Malika",  lastName: "Rахimova",  email: "malika@eta.uz",  phone: "+998 90 456 78 90", bio: "Kids & teens specialist, 5 years experience", subjects: ["Kids English", "Teen English"] },
  ];

  const teachers = await Promise.all(
    teacherData.map(async (t) => {
      const user = await prisma.user.create({
        data: {
          email: t.email,
          passwordHash: await bcrypt.hash("teacher123", 10),
          role: Role.TEACHER,
          firstName: t.firstName,
          lastName: t.lastName,
          phone: t.phone,
        },
      });
      const teacher = await prisma.teacher.create({
        data: { userId: user.id, bio: t.bio, subjects: t.subjects },
      });
      return { ...teacher, user };
    })
  );
  console.log(`✅ ${teachers.length} teachers created`);

  // ─── STUDENTS ─────────────────────────────────────────────────────────
  const studentData = [
    { firstName: "Aziz",    lastName: "Nazarov",   email: "aziz@student.uz",    level: EnglishLevel.INTERMEDIATE,       dob: "2002-04-15", parent: "Baxrom Nazarov",    parentPhone: "+998 90 111 11 11" },
    { firstName: "Zulfiya", lastName: "Mirzayeva", email: "zulfiya@student.uz", level: EnglishLevel.PRE_INTERMEDIATE,   dob: "2003-07-22", parent: "Nodira Mirzayeva",  parentPhone: "+998 90 222 22 22" },
    { firstName: "Bobur",   lastName: "Ergashev",  email: "bobur@student.uz",   level: EnglishLevel.BEGINNER,           dob: "2005-01-08", parent: "Hamid Ergashev",    parentPhone: "+998 90 333 33 33" },
    { firstName: "Nilufar", lastName: "Hasanova",  email: "nilufar@student.uz", level: EnglishLevel.UPPER_INTERMEDIATE, dob: "2001-11-30", parent: "Gulnora Hasanova",  parentPhone: "+998 90 444 44 44" },
    { firstName: "Sherzod", lastName: "Qodirov",   email: "sherzod@student.uz", level: EnglishLevel.ELEMENTARY,         dob: "2004-03-18", parent: "Alisher Qodirov",   parentPhone: "+998 90 555 55 55" },
    { firstName: "Madina",  lastName: "Umarova",   email: "madina@student.uz",  level: EnglishLevel.INTERMEDIATE,       dob: "2002-09-05", parent: "Kamola Umarova",    parentPhone: "+998 90 666 66 66" },
    { firstName: "Doniyor", lastName: "Sobirov",   email: "doniyor@student.uz", level: EnglishLevel.ADVANCED,           dob: "2000-06-12", parent: null,                parentPhone: null },
    { firstName: "Sabohat", lastName: "Tursunova", email: "sabohat@student.uz", level: EnglishLevel.PRE_INTERMEDIATE,   dob: "2003-12-25", parent: "Maftuna Tursunova", parentPhone: "+998 90 777 77 77" },
    { firstName: "Ulugbek", lastName: "Rустамов",  email: "ulugbek@student.uz", level: EnglishLevel.BEGINNER,           dob: "2006-02-14", parent: "Ravshan Rustamov",  parentPhone: "+998 90 888 88 88" },
    { firstName: "Feruza",  lastName: "Yuldasheva",email: "feruza@student.uz",  level: EnglishLevel.ELEMENTARY,         dob: "2005-08-20", parent: "Dilrabo Yuldasheva",parentPhone: "+998 90 999 99 99" },
  ];

  const students = await Promise.all(
    studentData.map(async (s) => {
      const user = await prisma.user.create({
        data: {
          email: s.email,
          passwordHash: await bcrypt.hash("student123", 10),
          role: Role.STUDENT,
          firstName: s.firstName,
          lastName: s.lastName,
        },
      });
      const student = await prisma.student.create({
        data: {
          userId: user.id,
          englishLevel: s.level,
          dateOfBirth: new Date(s.dob),
          parentName: s.parent ?? undefined,
          parentPhone: s.parentPhone ?? undefined,
        },
      });
      return { ...student, user };
    })
  );
  console.log(`✅ ${students.length} students created`);

  // ─── GROUPS ───────────────────────────────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups = await Promise.all([
    prisma.group.create({
      data: {
        name: "Morning Intermediate A",
        teacherId: teachers[0].id,
        level: EnglishLevel.INTERMEDIATE,
        schedule: "Mon/Wed/Fri  09:00–10:30",
        maxStudents: 8,
        startDate: new Date("2025-09-01"),
        monthlyFee: 500000,
      },
    }),
    prisma.group.create({
      data: {
        name: "Evening Pre-Int B",
        teacherId: teachers[0].id,
        level: EnglishLevel.PRE_INTERMEDIATE,
        schedule: "Tue/Thu  18:00–19:30",
        maxStudents: 10,
        startDate: new Date("2025-10-01"),
        monthlyFee: 450000,
      },
    }),
    prisma.group.create({
      data: {
        name: "IELTS Intensive",
        teacherId: teachers[1].id,
        level: EnglishLevel.UPPER_INTERMEDIATE,
        schedule: "Mon/Tue/Wed/Thu  17:00–18:30",
        maxStudents: 6,
        startDate: new Date("2025-11-01"),
        monthlyFee: 700000,
      },
    }),
    prisma.group.create({
      data: {
        name: "Beginners Weekend",
        teacherId: teachers[2].id,
        level: EnglishLevel.BEGINNER,
        schedule: "Sat/Sun  10:00–11:30",
        maxStudents: 12,
        startDate: new Date("2025-12-01"),
        monthlyFee: 350000,
      },
    }),
  ]);
  console.log(`✅ ${groups.length} groups created`);

  // ─── ENROLL STUDENTS ──────────────────────────────────────────────────
  const enrollments = [
    // Group 0: Morning Intermediate A — Aziz, Madina, Doniyor
    [students[0], students[5], students[6]],
    // Group 1: Evening Pre-Int B — Zulfiya, Sabohat, Feruza
    [students[1], students[7], students[9]],
    // Group 2: IELTS Intensive — Nilufar, Doniyor
    [students[3], students[6]],
    // Group 3: Beginners Weekend — Bobur, Sherzod, Ulugbek, Feruza
    [students[2], students[4], students[8], students[9]],
  ];

  for (let i = 0; i < groups.length; i++) {
    for (const student of enrollments[i]) {
      await prisma.groupStudent.create({
        data: { groupId: groups[i].id, studentId: student.id, joinedAt: groups[i].startDate },
      });
    }
  }
  console.log("✅ Students enrolled in groups");

  // ─── CLASS SESSIONS ───────────────────────────────────────────────────
  // Helper: sessions in the past (completed) and future (upcoming)
  const pastDates = (count: number, intervalDays: number): Date[] => {
    return Array.from({ length: count }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (i + 1) * intervalDays);
      d.setHours(9, 0, 0, 0);
      return d;
    }).reverse();
  };

  const futureDates = (count: number, intervalDays: number): Date[] => {
    return Array.from({ length: count }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (i + 1) * intervalDays);
      d.setHours(9, 0, 0, 0);
      return d;
    });
  };

  const sessionTopics = [
    "Present Perfect Tense", "Vocabulary: Business Terms", "Reading Comprehension", "Speaking Practice",
    "Conditionals", "Essay Writing", "Listening Skills", "Grammar Review",
    "IELTS Writing Task 1", "Pronunciation Workshop",
  ];

  // Group 0 sessions
  const g0PastDates = pastDates(6, 2);
  const g0Sessions = await Promise.all([
    ...g0PastDates.map((d, i) =>
      prisma.classSession.create({
        data: {
          groupId: groups[0].id,
          teacherId: teachers[0].id,
          scheduledAt: d,
          topic: sessionTopics[i % sessionTopics.length],
          isCompleted: true,
          duration: 90,
        },
      })
    ),
    ...futureDates(3, 2).map((d, i) =>
      prisma.classSession.create({
        data: {
          groupId: groups[0].id,
          teacherId: teachers[0].id,
          scheduledAt: d,
          topic: sessionTopics[(6 + i) % sessionTopics.length],
          isCompleted: false,
          duration: 90,
        },
      })
    ),
  ]);

  // Group 1 sessions
  const g1PastDates = pastDates(4, 3);
  const g1Sessions = await Promise.all([
    ...g1PastDates.map((d, i) =>
      prisma.classSession.create({
        data: {
          groupId: groups[1].id,
          teacherId: teachers[0].id,
          scheduledAt: (() => { const nd = new Date(d); nd.setHours(18, 0, 0, 0); return nd; })(),
          topic: sessionTopics[(i + 2) % sessionTopics.length],
          isCompleted: true,
          duration: 90,
        },
      })
    ),
    ...futureDates(2, 3).map((d, i) =>
      prisma.classSession.create({
        data: {
          groupId: groups[1].id,
          teacherId: teachers[0].id,
          scheduledAt: (() => { const nd = new Date(d); nd.setHours(18, 0, 0, 0); return nd; })(),
          topic: sessionTopics[(4 + i) % sessionTopics.length],
          isCompleted: false,
          duration: 90,
        },
      })
    ),
  ]);

  // Group 2 sessions
  const g2Sessions = await Promise.all([
    ...pastDates(5, 1).map((d, i) =>
      prisma.classSession.create({
        data: {
          groupId: groups[2].id,
          teacherId: teachers[1].id,
          scheduledAt: (() => { const nd = new Date(d); nd.setHours(17, 0, 0, 0); return nd; })(),
          topic: sessionTopics[(i + 4) % sessionTopics.length],
          isCompleted: true,
          duration: 90,
        },
      })
    ),
    ...futureDates(4, 1).map((d, i) =>
      prisma.classSession.create({
        data: {
          groupId: groups[2].id,
          teacherId: teachers[1].id,
          scheduledAt: (() => { const nd = new Date(d); nd.setHours(17, 0, 0, 0); return nd; })(),
          topic: "IELTS Mock Test",
          isCompleted: false,
          duration: 90,
        },
      })
    ),
  ]);

  // Group 3 sessions (weekend)
  const g3Sessions = await Promise.all([
    ...pastDates(3, 7).map((d, i) =>
      prisma.classSession.create({
        data: {
          groupId: groups[3].id,
          teacherId: teachers[2].id,
          scheduledAt: (() => { const nd = new Date(d); nd.setHours(10, 0, 0, 0); return nd; })(),
          topic: ["Alphabet & Phonics", "Basic Greetings", "Numbers & Colors"][i],
          isCompleted: true,
          duration: 90,
        },
      })
    ),
    ...futureDates(2, 7).map((d) =>
      prisma.classSession.create({
        data: {
          groupId: groups[3].id,
          teacherId: teachers[2].id,
          scheduledAt: (() => { const nd = new Date(d); nd.setHours(10, 0, 0, 0); return nd; })(),
          topic: "Everyday Vocabulary",
          isCompleted: false,
          duration: 90,
        },
      })
    ),
  ]);

  console.log("✅ Class sessions created");

  // ─── ATTENDANCE ───────────────────────────────────────────────────────
  const statuses: AttendanceStatus[] = [
    AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT,
  ];

  // Group 0 attendance (Aziz, Madina, Doniyor)
  const g0Students = enrollments[0];
  const g0Completed = g0Sessions.filter((s) => s.isCompleted);
  for (const session of g0Completed) {
    for (let si = 0; si < g0Students.length; si++) {
      await prisma.attendance.create({
        data: {
          classSessionId: session.id,
          studentId: g0Students[si].id,
          status: statuses[(g0Completed.indexOf(session) + si) % statuses.length],
        },
      });
    }
  }

  // Group 1 attendance
  const g1Students = enrollments[1];
  const g1Completed = g1Sessions.filter((s) => s.isCompleted);
  for (const session of g1Completed) {
    for (let si = 0; si < g1Students.length; si++) {
      await prisma.attendance.create({
        data: {
          classSessionId: session.id,
          studentId: g1Students[si].id,
          status: statuses[(g1Completed.indexOf(session) + si + 1) % statuses.length],
        },
      });
    }
  }

  // Group 2 attendance
  const g2Students = enrollments[2];
  const g2Completed = g2Sessions.filter((s) => s.isCompleted);
  for (const session of g2Completed) {
    for (let si = 0; si < g2Students.length; si++) {
      await prisma.attendance.create({
        data: {
          classSessionId: session.id,
          studentId: g2Students[si].id,
          status: si === 0 ? AttendanceStatus.PRESENT : AttendanceStatus.PRESENT,
        },
      });
    }
  }

  // Group 3 attendance
  const g3Students = enrollments[3];
  const g3Completed = g3Sessions.filter((s) => s.isCompleted);
  for (const session of g3Completed) {
    for (let si = 0; si < g3Students.length; si++) {
      await prisma.attendance.create({
        data: {
          classSessionId: session.id,
          studentId: g3Students[si].id,
          status: statuses[(g3Completed.indexOf(session) * 2 + si) % statuses.length],
        },
      });
    }
  }

  console.log("✅ Attendance recorded");

  // ─── GRADES ───────────────────────────────────────────────────────────
  const gradeLabels = ["Homework", "Quiz", "Speaking Test", "Writing Task", "Listening Test"];
  const gradeScores = [
    [82, 91, 78, 88, 95],  // Aziz
    [75, 68, 80, 72, 85],  // Madina
    [95, 98, 92, 97, 99],  // Doniyor (advanced)
    [70, 65, 73, 68, 78],  // Zulfiya
    [88, 84, 90, 86, 92],  // Sabohat
    [60, 55, 65, 58, 70],  // Feruza
    [90, 94, 88, 96, 91],  // Nilufar
    [72, 68, 75, 70, 80],  // Doniyor in IELTS
  ];

  // Grades for Group 0 students
  for (let si = 0; si < g0Students.length; si++) {
    const scores = gradeScores[si];
    for (let gi = 0; gi < Math.min(scores.length, g0Completed.length); gi++) {
      await prisma.grade.create({
        data: {
          studentId: g0Students[si].id,
          classSessionId: g0Completed[gi]?.id,
          score: scores[gi],
          maxScore: 100,
          label: gradeLabels[gi % gradeLabels.length],
        },
      });
    }
  }

  // Grades for Group 2 students (IELTS)
  for (let si = 0; si < g2Students.length; si++) {
    const scores = gradeScores[6 + si];
    for (let gi = 0; gi < Math.min(scores.length, g2Completed.length); gi++) {
      await prisma.grade.create({
        data: {
          studentId: g2Students[si].id,
          classSessionId: g2Completed[gi]?.id,
          score: scores[gi],
          maxScore: 100,
          label: gradeLabels[gi % gradeLabels.length],
        },
      });
    }
  }

  console.log("✅ Grades recorded");

  // ─── INVOICES & PAYMENTS ──────────────────────────────────────────────
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Create invoices for all groups for previous and current month
  for (const group of groups) {
    const prevInvoice = await prisma.invoice.create({
      data: {
        groupId: group.id,
        month: prevMonth,
        year: prevYear,
        amount: group.monthlyFee,
        currency: "UZS",
        dueDate: new Date(prevYear, prevMonth - 1, 25),
      },
    });

    const currInvoice = await prisma.invoice.create({
      data: {
        groupId: group.id,
        month: currentMonth,
        year: currentYear,
        amount: group.monthlyFee,
        currency: "UZS",
        dueDate: new Date(currentYear, currentMonth - 1, 25),
      },
    });

    // Create payments for each enrolled student
    const groupEnrolled = enrollments[groups.indexOf(group)];
    for (const student of groupEnrolled) {
      // Previous month: most paid
      await prisma.payment.create({
        data: {
          studentId: student.id,
          invoiceId: prevInvoice.id,
          amount: group.monthlyFee,
          currency: "UZS",
          status: PaymentStatus.PAID,
          paidAt: new Date(prevYear, prevMonth - 1, Math.floor(Math.random() * 15) + 5),
          method: ["cash", "card", "transfer"][Math.floor(Math.random() * 3)],
        },
      });

      // Current month: mix of paid, pending, overdue
      const statusOptions = [PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.OVERDUE];
      const status = statusOptions[Math.floor(Math.random() * 3)];
      await prisma.payment.create({
        data: {
          studentId: student.id,
          invoiceId: currInvoice.id,
          amount: group.monthlyFee,
          currency: "UZS",
          status,
          paidAt: status === PaymentStatus.PAID ? new Date(currentYear, currentMonth - 1, Math.floor(Math.random() * 10) + 1) : null,
          method: status === PaymentStatus.PAID ? ["cash", "card", "transfer"][Math.floor(Math.random() * 3)] : null,
        },
      });
    }
  }

  console.log("✅ Invoices and payments created");

  // ─── ANNOUNCEMENTS ────────────────────────────────────────────────────
  await prisma.announcement.createMany({
    data: [
      {
        title: "🎉 Welcome to ETA Academy Spring Term!",
        body: "Dear students and teachers, we are excited to kick off the new term. Please make sure your schedules are up to date and reach out to admin with any questions.",
        targetRole: null,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "📅 May Holiday Schedule",
        body: "Classes will be suspended on May 9th (Victory Day). All sessions will resume on May 12th. Please plan accordingly.",
        targetRole: null,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "💳 Payment Reminder",
        body: "Monthly tuition fees are due by the 25th. Students with overdue payments should contact the admin office immediately to avoid suspension.",
        targetRole: Role.STUDENT,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: "📊 Grading System Update",
        body: "Starting this month, speaking tests will be weighted at 30% of the overall grade. Please update your grading sheets accordingly.",
        targetRole: Role.TEACHER,
        createdAt: new Date(),
      },
    ],
  });

  console.log("✅ Announcements created");

  // ─── SUMMARY ─────────────────────────────────────────────────────────
  console.log("\n🎓 ETA Academy seed complete!");
  console.log("─────────────────────────────────");
  console.log("Admin:    admin@eta.uz / admin123");
  console.log("Teachers: dilnoza@eta.uz, jasur@eta.uz, malika@eta.uz / teacher123");
  console.log("Students: aziz@student.uz … feruza@student.uz / student123");
  console.log("─────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Real student names extracted from every group sheet of the May 2026 spreadsheet
// Count matches the May Main tab: total 164 students across 14 groups
const GROUP_STUDENTS: Record<string, Array<{ name: string; phone?: string }>> = {
  "Pre Ab2": [
    { name: "Mamadjanova Umida",         phone: "50 774 27 71" },
    { name: "Xusniddinov Fayozbek",      phone: "97 520 19 64" },
    { name: "Abdurahmanova Shahlo",       phone: "93 945 65 36" },
    { name: "Xasanboyev Muhammadamin",    phone: "97 270 42 49" },
    { name: "Komiljanova Shukrona" },
    { name: "Muhammadvaliyeva Zilola",    phone: "99 390 49 50" },
    { name: "Mutalliyev Nodirbek" },
    { name: "Azamov Shahzod",            phone: "93 708 05 05" },
  ],
  "Inter Ab2": [
    { name: "Rahmanov Isfandiyor",        phone: "93 901 51 41" },
    { name: "Sultonbekov Abrorbek",       phone: "93 097 09 08" },
    { name: "Sobitxanov Azizbek",         phone: "93 945 72 19" },
    { name: "Solijanov Barkamol" },
    { name: "Shaxriyor" },
    { name: "Mustafo" },
    { name: "Baxramov Bexruzbek",         phone: "50 887 75 81" },
  ],
  "Beginner Ab2": [
    { name: "Xusniddinov Hayotbek",       phone: "97 520 19 64" },
    { name: "Azamjon" },
    { name: "Arabxujayeva Dildora",       phone: "88 256 65 65" },
    { name: "Zokirjanova Mohlaroy",       phone: "93 262 62 52" },
  ],
  "Kids Ab1": [
    { name: "Islombek",                   phone: "88 620 05 01" },
    { name: "Abdumalikova Komila",        phone: "94 123 56 74" },
    { name: "Ilhomjanova Mavluda",        phone: "91 342 93 93" },
    { name: "Gofurjanov Bunyodbek",       phone: "93 042 77 75" },
    { name: "Shokirov Muhammadamin",      phone: "97 270 11 10" },
    { name: "Akramov Sardorbek",          phone: "99 247 77 44" },
    { name: "Nematullayev Afzalbek",      phone: "93 263 87 91" },
    { name: "Alimjanov Muhammadyusuf" },
    { name: "Abdulboqiyev Dovudxon",      phone: "94 715 12 06" },
    { name: "Vahabjanova Muslima" },
    { name: "Gulomjanova Durdona",        phone: "97 371 00 85" },
  ],
  "Kids Ab2": [
    { name: "Odiljanov Ahadjon",          phone: "93 494 56 64" },
    { name: "Qodirjanov Qosimjon",        phone: "94 150 43 66" },
    { name: "Gulamjanova Dilafruz",       phone: "99 022 85 12" },
    { name: "Avazjanova Muazzam",         phone: "93 947 66 56" },
    { name: "Abdullajonova Shahrizoda",   phone: "94 307 89 09" },
  ],
  "Kids Ab3": [
    { name: "Muxtasar" },
    { name: "Ikromjanova Iroda",          phone: "33 373 00 59" },
    { name: "Islomjon" },
    { name: "Rahimova Madina",            phone: "99 481 85 51" },
    { name: "Alijanova Farzona",          phone: "99 268 88 89" },
    { name: "Ibrahimov Mehriddin",        phone: "93 145 82 15" },
    { name: "Abdumannopov Xushnudbek",   phone: "99 531 91 72" },
    { name: "Mamataliyev Akbar",          phone: "94 873 12 20" },
    { name: "Abduvohitov Jamshid",        phone: "91 280 14 04" },
    { name: "Turdialiyev Sanjarbek",      phone: "90 797 01 95" },
    { name: "Rustamova Iroda",            phone: "93 194 19 00" },
    { name: "Abdukarimova Madina" },
  ],
  "Kids Ab4": [
    { name: "Ikramjanova Ezoza",          phone: "94 865 88 03" },
    { name: "Abdullayev Umarjon",         phone: "99 419 00 40" },
    { name: "Orifjanova Hikmatoy",        phone: "97 620 63 13" },
    { name: "Abduvalikova Nigora",        phone: "95 048 07 93" },
    { name: "Mamatov Bexruz",            phone: "93 943 40 00" },
    { name: "Abdullayev Bexruz",          phone: "50 090 66 11" },
    { name: "Abdullayev Omadbek" },
    { name: "Mirzaaxmedov Ibrohim",       phone: "90 794 10 00" },
    { name: "Abdullayev Axrorbek",        phone: "94 652 09 06" },
    { name: "Atavaliya Madina",           phone: "99 393 79 86" },
    { name: "Odiljanova Zuxraxon",        phone: "93 268 82 12" },
    { name: "Ahmadjanov Abubakr",         phone: "93 962 99 66" },
    { name: "Noila" },
    { name: "Gofurjanov Abdulahat",       phone: "93 130 46 44" },
    { name: "Hamidullayeva Mohlaroy" },
    { name: "Nargiza" },
    { name: "Sobirjanov Azizbek",         phone: "95 141 60 09" },
  ],
  "Doniyor guruhi": [
    { name: "Numanjanova Mubina",         phone: "94 907 38 87" },
    { name: "Tojiddinova Mushtariy",      phone: "33 722 11 10" },
    { name: "Ismoiljanova Marjona",       phone: "95 161 62 61" },
    { name: "Otamirzayeva Shahlo",        phone: "93 678 48 35" },
    { name: "Botirjanov Mufazzil",        phone: "95 771 86 86" },
    { name: "Boqijanov Faxriddin",        phone: "93 734 05 03" },
    { name: "Rayxona" },
    { name: "Umida" },
    { name: "Shahlo" },
    { name: "Marxabo" },
    { name: "Dostonbek" },
    { name: "Shaxboz" },
    { name: "Abdusattarov Muhammadyusuf" },
    { name: "Azima" },
    { name: "Nafisa" },
    { name: "Dilshod" },
    { name: "Ikramjanova Saida" },
    { name: "Bilolxon" },
    { name: "Muhammadali" },
    { name: "Islombek" },
    { name: "Dilshoda" },
  ],
  "Bekzod guruhi": [
    { name: "Xamidjanova Rayxona",        phone: "33 552 83 87" },
    { name: "Xumoyun" },
    { name: "Mushtariy" },
    { name: "Dilnoza" },
    { name: "Robiya" },
    { name: "Izzatullayev Bekzod" },
    { name: "Usmanov Abubakr",            phone: "93 925 17 67" },
    { name: "Dadamirzayev Azamat",        phone: "93 499 18 71" },
    { name: "Karimjanov Xondamir",        phone: "99 433 62 29" },
    { name: "Xoshimjanova Gulsanam",      phone: "93 584 84 89" },
    { name: "Asqaraliyeva Kumush" },
    { name: "Charos" },
    { name: "Azizbek" },
    { name: "Azamat" },
    { name: "Gulzoda" },
    { name: "Muhammadyunus",              phone: "93 144 32 84" },
    { name: "Bekmirzayeva Mubina",        phone: "94 153 52 54" },
    { name: "Xolmirzayeva Dilnoza",       phone: "93 580 95 85" },
    { name: "Hakimjanov Muhammadzohid" },
    { name: "Djalilov Alisher" },
    { name: "Temurbek" },
    { name: "Ochildiyev Faxriddin" },
    { name: "Mahammadjanov Sardorbek",    phone: "97 858 18 08" },
    { name: "Nematullayev Sardorbek",     phone: "50 506 55 26" },
    { name: "Muhammadali" },
  ],
  "Rus tili N": [
    { name: "Muslima",                    phone: "93 943 07 57" },
    { name: "Otaxanova Kumushoy" },
    { name: "Dedaxanov Azizbek" },
    { name: "Baxramjonov Iqboljon",       phone: "97 123 07 03" },
    { name: "Nurbek",                     phone: "77 370 79 71" },
    { name: "Shirina",                    phone: "77 370 79 71" },
    { name: "Urayimova Rayxona",          phone: "94 079 83 83" },
    { name: "Xolmirzayeva Barchinoy",     phone: "70 233 04 59" },
    { name: "Muhammadali" },
    { name: "Hadicha",                    phone: "94 633 33 86" },
    { name: "Xusanboyeva Xilola",         phone: "50 767 71 09" },
    { name: "Mahamadjanov Azizbek",       phone: "77 715 14 05" },
    { name: "Begoyim" },
    { name: "Abdulazizov Mirzohid",       phone: "93 434 01 07" },
    { name: "Muhammadjanov Abror",        phone: "50 123 00 57" },
  ],
  "Oisha guruhi": [
    { name: "Xasanbayev Azizbek" },
    { name: "Rashidova Gulzoda",          phone: "90 214 76 56" },
    { name: "Maxmudjanov Muhammadali",    phone: "93 405 51 26" },
    { name: "Mustafo",                    phone: "94 508 11 91" },
    { name: "Muhammadaziz" },
    { name: "Mansurbek",                  phone: "91 294 36 60" },
    { name: "Isomiddinov Farrux",         phone: "94 897 51 59" },
    { name: "Usmanjanova Farangiz",       phone: "97 623 13 83" },
    { name: "Otaxanova Oydina",           phone: "94 174 00 27" },
    { name: "Obidjanova Ozoda",           phone: "94 502 27 12" },
    { name: "Isomiddinov Azamat" },
    { name: "Mufara" },
  ],
  "Elbek guruhi": [
    { name: "Abduganiyev Abdulhoshim",    phone: "70 030 48 11" },
    { name: "Nasliddinova Dilnoza" },
    { name: "Nasliddinova Dildora" },
    { name: "Vaxabova Odina" },
    { name: "Abdulhamidova Diyora" },
    { name: "Munisa" },
    { name: "Tuxtasinov Abduxalil",       phone: "88 471 55 15" },
    { name: "Turgunpolatov Marufjon",     phone: "93 997 55 35" },
    { name: "Ismailova Shirina",          phone: "93 678 91 01" },
    { name: "Afzalbek" },
    { name: "Bahramova Guljona",          phone: "93 409 22 32" },
    { name: "Abdurahmanova Sarvinoz",     phone: "93 826 83 85" },
    { name: "Karimjanov Muhammadkarim",   phone: "93 268 09 83" },
  ],
  "Navruz guruhi": [
    { name: "Abdulboqiyev Ziyodbek",      phone: "99 975 72 84" },
    { name: "Ismoil" },
    { name: "Islombek",                   phone: "94 486 24 54" },
    { name: "Dilnoza" },
    { name: "Alimjanov Shoxrux",          phone: "94 921 23 26" },
    { name: "Izzatullayev Boburjon",      phone: "88 837 76 67" },
    { name: "Xamidullayev Abdulbosit",    phone: "94 037 15 11" },
    { name: "Ahmadjanov Asadbek",         phone: "93 962 99 66" },
    { name: "Ahrorbek",                   phone: "99 322 29 20" },
  ],
  "Dilafruz guruhi": [
    { name: "Umarbek",                    phone: "99 419 00 40" },
    { name: "Hikmatoy",                   phone: "97 620 63 13" },
    { name: "Abubakr",                    phone: "99 226 62 92" },
    { name: "Ahmadjanov Abubakr" },
    { name: "Xamidullayeva Mohlaroyim" },
  ],
};

// Group name → URL slug for email generation
const GROUP_SLUG: Record<string, string> = {
  "Pre Ab2":        "preab2",
  "Inter Ab2":      "interab2",
  "Beginner Ab2":   "begab2",
  "Kids Ab1":       "kidsab1",
  "Kids Ab2":       "kidsab2",
  "Kids Ab3":       "kidsab3",
  "Kids Ab4":       "kidsab4",
  "Doniyor guruhi": "doniyor",
  "Bekzod guruhi":  "bekzod",
  "Rus tili N":     "rustili",
  "Oisha guruhi":   "oisha",
  "Elbek guruhi":   "elbek",
  "Navruz guruhi":  "navruz",
  "Dilafruz guruhi":"dilafruz",
};

function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "-" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];
  const pwHash = await bcrypt.hash("student123", 10);

  try {
    // ── 1. Deactivate all placeholder bulk-payment students (pay.xxx@discover.uz)
    const placeholders = await prisma.user.findMany({
      where: { email: { startsWith: "pay." } },
      include: { student: true },
    });
    let deactivated = 0;
    for (const u of placeholders) {
      await prisma.user.update({ where: { id: u.id }, data: { isActive: false } });
      if (u.student) {
        await prisma.student.update({ where: { id: u.student.id }, data: { status: "INACTIVE" } });
      }
      deactivated++;
    }
    log.push(`Deactivated ${deactivated} placeholder payment students`);

    // ── 2. Deactivate demo student if present
    const demoUser = await prisma.user.findUnique({ where: { email: "student@discover.uz" } });
    if (demoUser) {
      await prisma.user.update({ where: { id: demoUser.id }, data: { isActive: false } });
      const demoStudent = await prisma.student.findUnique({ where: { userId: demoUser.id } });
      if (demoStudent) {
        await prisma.student.update({ where: { id: demoStudent.id }, data: { status: "INACTIVE" } });
      }
      log.push("Deactivated demo student");
    }

    // ── 3. Create real students per group
    let created = 0;
    let skipped = 0;

    for (const [groupName, students] of Object.entries(GROUP_STUDENTS)) {
      const slug = GROUP_SLUG[groupName];
      if (!slug) { log.push(`⚠ No slug for ${groupName}`); continue; }

      // Find group
      const group = await prisma.group.findFirst({ where: { name: groupName } });
      if (!group) { log.push(`⚠ Group not found: ${groupName}`); continue; }

      for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const email = `${slug}.${i + 1}@discover.uz`;
        const { firstName, lastName } = parseName(s.name);

        // Check if already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          skipped++;
          continue;
        }

        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash: pwHash,
            firstName,
            lastName,
            role: "STUDENT",
            isActive: true,
            phone: s.phone,
          },
        });

        // Create student record
        const student = await prisma.student.create({
          data: {
            userId: user.id,
            status: "ACTIVE",
            enrollmentDate: new Date("2025-09-01"),
          },
        });

        // Enroll in group
        await prisma.groupStudent.create({
          data: { groupId: group.id, studentId: student.id, isActive: true },
        });

        created++;
      }

      log.push(`${groupName}: enrolled ${students.length} students`);
    }

    log.push(`Total created: ${created}, skipped (already exist): ${skipped}`);

    return NextResponse.json({ success: true, log });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, log }, { status: 500 });
  }
}

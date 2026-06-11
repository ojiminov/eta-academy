import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// All leads from the Qabul (reception) sheet of the May 2026 spreadsheet
// status: ACTIVE = enrolled, TRIAL = came for trial, LEAD = just registered
const LEADS = [
  // Guruhga qoshildi = TRUE (enrolled → now active students)
  { firstName: "Abdulazizov",     lastName: "Mirzohid",         phone: "+998934340107", source: "OTHER",     status: "ACTIVE",  interestedLevel: "BEGINNER",         date: "2026-03-24", notes: "rus tili, 9-sinf. Shahnoza guruhiga qo'shildi" },
  { firstName: "Bekmirzayeva",    lastName: "Mubina",           phone: "+998941535254", source: "OTHER",     status: "ACTIVE",  interestedLevel: "ELEMENTARY",        date: "2026-04-01", notes: "ingliz tili, 9-sinf. Bekzod guruhiga qo'shildi" },
  { firstName: "Xolmirzayeva",    lastName: "Dilnoza",          phone: "+998935809585", source: "OTHER",     status: "ACTIVE",  interestedLevel: "ELEMENTARY",        date: "2026-04-01", notes: "9-sinf. Bekzod guruhiga qo'shildi" },
  { firstName: "Mahammadjanov",   lastName: "Sardorbek",        phone: "+998978581808", source: "OTHER",     status: "ACTIVE",  interestedLevel: "INTERMEDIATE",      date: "2026-04-15", notes: "ingliz tili, kollej. Bekzod guruhiga qo'shildi" },
  { firstName: "Nematullayev",    lastName: "Sardorbek",        phone: "+998505065526", source: "OTHER",     status: "ACTIVE",  interestedLevel: "INTERMEDIATE",      date: "2026-04-16", notes: "ingliz tili, kollej. Bekzod guruhiga qo'shildi" },
  { firstName: "Tuxtasinov",      lastName: "Abduxalil",        phone: "+998884715515", source: "OTHER",     status: "ACTIVE",  interestedLevel: "ELEMENTARY",        date: "2026-05-04", notes: "ingliz tili, 10-sinf. Elbek guruhiga qo'shildi" },
  { firstName: "Turgunpolatov",   lastName: "Marufjon",         phone: "+998939975535", source: "OTHER",     status: "ACTIVE",  interestedLevel: "ELEMENTARY",        date: "2026-05-04", notes: "ingliz tili, 10-sinf. Elbek guruhiga qo'shildi" },
  { firstName: "Ismailova",       lastName: "Shirina",          phone: "+998936789101", source: "OTHER",     status: "ACTIVE",  interestedLevel: "ELEMENTARY",        date: "2026-05-05", notes: "ingliz tili, 10-sinf. Elbek guruhiga qo'shildi" },
  { firstName: "Muhammadjanov",   lastName: "Abror",            phone: "+998501230057", source: "OTHER",     status: "ACTIVE",  interestedLevel: "BEGINNER",          date: "2026-05-08", notes: "rus tili, 11-sinf. Shahnoza guruhiga qo'shildi" },
  { firstName: "Sobirjanov",      lastName: "Azizbek",          phone: "+998951416009", source: "OTHER",     status: "ACTIVE",  interestedLevel: "BEGINNER",          date: "2026-05-11", notes: "ingliz tili, 7-sinf. Abdusattor guruhiga qo'shildi" },
  { firstName: "Abdurahmanova",   lastName: "Sarvinoz",         phone: "+998938268385", source: "OTHER",     status: "ACTIVE",  interestedLevel: "ELEMENTARY",        date: "2026-05-18", notes: "ingliz tili, 9-sinf. Elbek guruhiga qo'shildi" },
  { firstName: "Bahramova",       lastName: "Guljona",          phone: "+998934092232", source: "OTHER",     status: "ACTIVE",  interestedLevel: "ELEMENTARY",        date: "2026-05-18", notes: "ingliz tili, 9-sinf. Elbek guruhiga qo'shildi" },
  { firstName: "Zokirjanova",     lastName: "Mohlaroy",         phone: "+998932626252", source: "OTHER",     status: "ACTIVE",  interestedLevel: "BEGINNER",          date: "2026-05-23", notes: "ingliz tili, 3-sinf. Abdusattor guruhiga qo'shildi" },
  { firstName: "Karimjanov",      lastName: "Muhammadkarim",    phone: "+998932680983", source: "OTHER",     status: "ACTIVE",  interestedLevel: "ELEMENTARY",        date: "2026-05-25", notes: "ingliz tili, 9-sinf. Elbek guruhiga qo'shildi" },
  { firstName: "Baxramov",        lastName: "Bexruzbek",        phone: "+998508877581", source: "OTHER",     status: "ACTIVE",  interestedLevel: "PRE_INTERMEDIATE",   date: "2026-05-29", notes: "ingliz tili. Test natijalari bor. Abdusattor (Inter Ab2) ga qo'shildi" },
  { firstName: "Gulomjanova",     lastName: "Durdona",          phone: "+998973710085", source: "OTHER",     status: "ACTIVE",  interestedLevel: "BEGINNER",          date: "2026-05-30", notes: "ingliz tili, 5-sinf. Abdusattor guruhiga qo'shildi" },

  // Sinov dars only (trial attended, not yet enrolled)
  { firstName: "Olimjanov",       lastName: "Ibrohim",          phone: "+998997066000", source: "OTHER",     status: "TRIAL",   interestedLevel: "ELEMENTARY",        date: "2026-04-16", notes: "ingliz tili, 9-sinf. Bekzod guruhiga yo'naltirildi. 1-darsga keldi" },
  { firstName: "Turaboyeva",      lastName: "Nilufar",          phone: "+998882123789", source: "OTHER",     status: "TRIAL",   interestedLevel: "ELEMENTARY",        date: "2026-04-17", notes: "ingliz tili, 10-sinf. Bekzod guruhiga yo'naltirildi. 1-darsga keldi" },

  // Not yet converted (lead only)
  { firstName: "Odiljanova",      lastName: "Zuxraxon",         phone: "+998932688212", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-04-02", notes: "ingliz tili, 6-sinf. Abdusattor" },
  { firstName: "Ravshanjanov",    lastName: "Jobirbek",         phone: "+998934016294", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-04-14", notes: "ingliz tili, 4-sinf. Abdusattor" },
  { firstName: "Rahmatullayev",   lastName: "Islombek",         phone: "+998934952594", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-04-20", notes: "matematika, 3-sinf. Marxabo o'qituvchiga yo'naltirildi" },
  { firstName: "Juraxanova",      lastName: "Zilola",           phone: "+998885737002", source: "OTHER",     status: "LEAD",    interestedLevel: "ELEMENTARY",        date: "2026-04-24", notes: "ingliz tili" },
  { firstName: "Abdurashidova",   lastName: "Marxabo",          phone: "+998972552422", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-04-24", notes: "rus tili, 9-sinf. Shahnoza guruhiga yo'naltirildi" },
  { firstName: "Nosirjanov",      lastName: "Azamat",           phone: "+998990060112", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-04-25", notes: "matematika, 6-sinf" },
  { firstName: "Karimjanov",      lastName: "Afzal",            phone: "+998885554090", source: "OTHER",     status: "LEAD",    interestedLevel: "ELEMENTARY",        date: "2026-05-04", notes: "ingliz tili, 9-sinf. Bekzod" },
  { firstName: "Madmudjanov",     lastName: "Alibek",           phone: "+998941456677", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-05-07", notes: "matematika, 6-sinf. Dilafruz" },
  { firstName: "Maxmudjanova",    lastName: "Muslima",          phone: "",              source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-05-07", notes: "matematika, 3-sinf. Dilafruz" },
  { firstName: "Abdulvoitov",     lastName: "Azizbek",          phone: "+998772118899", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-05-08", notes: "rus tili. Shahnoza" },
  { firstName: "Mahamadaliyeva",  lastName: "Noila",            phone: "+998950313381", source: "OTHER",     status: "LEAD",    interestedLevel: "INTERMEDIATE",      date: "2026-05-16", notes: "ingliz tili, 9-sinf. Doniyor" },
  { firstName: "Dilnoza",         lastName: "(Navruz)",         phone: "+998939457124", source: "OTHER",     status: "LEAD",    interestedLevel: "ELEMENTARY",        date: "2026-05-19", notes: "ingliz tili, 7-sinf. Navruz" },
  { firstName: "Jaloliddinova",   lastName: "Dilshoda",         phone: "+998949238235", source: "OTHER",     status: "LEAD",    interestedLevel: "ELEMENTARY",        date: "2026-05-26", notes: "ingliz tili, 9-sinf. Elbek" },
  { firstName: "Rustamjanov",     lastName: "Muhammadmustafo",  phone: "+998773375277", source: "OTHER",     status: "LEAD",    interestedLevel: "ELEMENTARY",        date: "2026-05-26", notes: "ingliz tili, 7-sinf. O'qituvchi belgilanmagan" },
  { firstName: "Boltaboyeva",     lastName: "Fotima",           phone: "+998880515307", source: "OTHER",     status: "LEAD",    interestedLevel: "ELEMENTARY",        date: "2026-05-29", notes: "ingliz tili. Navruz" },
  { firstName: "Ismoilova",       lastName: "Ugiloy",           phone: "+998505811017", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-05-29", notes: "rus tili, 2002-yilgi. Shahnoza" },
  { firstName: "Abdumominova",    lastName: "Shirin",           phone: "+998943606040", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-06-01", notes: "rus tili, 9-sinf" },
  { firstName: "Tohirjanov",      lastName: "Anvarjon",         phone: "+998954571126", source: "OTHER",     status: "LEAD",    interestedLevel: "ELEMENTARY",        date: "2026-06-01", notes: "ingliz tili, 8-sinf" },
  { firstName: "Tursunboyev",     lastName: "Mirasror",         phone: "+998946887171", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-06-01", notes: "ingliz tili, 5-sinf. Navruz" },
  { firstName: "Jamoldinova",     lastName: "Madina",           phone: "+998942610301", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-06-01", notes: "tarix, 11-sinf" },
  { firstName: "Nosirjanova",     lastName: "Saodat",           phone: "+998942610301", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-06-01", notes: "tarix, 11-sinf" },
  { firstName: "Yoqubbekova",     lastName: "Asalxon",          phone: "+998942972888", source: "OTHER",     status: "LEAD",    interestedLevel: "BEGINNER",          date: "2026-06-02", notes: "ingliz tili, 6-sinf" },
  { firstName: "Nematullayeva",   lastName: "Shoxsanam",        phone: "+998942638791", source: "OTHER",     status: "LEAD",    interestedLevel: "ELEMENTARY",        date: "2026-06-02", notes: "ingliz tili, 7-sinf" },
];

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];
  let created = 0;
  let skipped = 0;

  try {
    for (const lead of LEADS) {
      // Check for duplicate by phone (if phone provided)
      if (lead.phone) {
        const exists = await prisma.lead.findFirst({ where: { phone: lead.phone } });
        if (exists) { skipped++; continue; }
      } else {
        // Check by name
        const exists = await prisma.lead.findFirst({
          where: { firstName: lead.firstName, lastName: lead.lastName },
        });
        if (exists) { skipped++; continue; }
      }

      await prisma.lead.create({
        data: {
          id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          firstName: lead.firstName,
          lastName: lead.lastName,
          phone: lead.phone || "—",
          source: lead.source as "OTHER",
          status: lead.status as "LEAD" | "TRIAL" | "ACTIVE" | "GRADUATE" | "INACTIVE",
          interestedLevel: lead.interestedLevel as "BEGINNER" | "ELEMENTARY" | "PRE_INTERMEDIATE" | "INTERMEDIATE" | "UPPER_INTERMEDIATE" | "ADVANCED",
          notes: lead.notes,
          createdAt: new Date(lead.date),
        },
      });
      created++;
    }

    log.push(`Created ${created} leads, skipped ${skipped} duplicates`);
    return NextResponse.json({ success: true, log });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, log }, { status: 500 });
  }
}

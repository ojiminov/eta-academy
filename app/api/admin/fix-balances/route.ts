import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

// Qoldiq (remaining debt) from Google Sheets — stored as NEGATIVE balance
// (negative = student owes money, shown in debtors section)
const DEBTS: { email: string; debt: number; name: string }[] = [
  // Inter Ab2
  { email: "abrorbek.sultonbekov@discover.uz",    debt: 350000, name: "Sultonbekov Abrorbek" },

  // Pre Ab2
  { email: "muhammadamin.xasanboyev@discover.uz",  debt: 300000, name: "Xasanboyev Muhammadamin" },

  // Kids Ab1
  { email: "dovudxon.abdulboqiyev@discover.uz",    debt: 250000, name: "Abdulboqiyev Dovudxon" },

  // Kids Ab2
  { email: "shahrizoda.abdullajonova@discover.uz",  debt: 300000, name: "Abdullajonova Shahrizoda" },

  // Kids Ab3
  { email: "mustafo2@discover.uz",                  debt: 250000, name: "Mustafo (Kids Ab3)" },

  // Navruz group
  { email: "ismoil@discover.uz",                    debt: 250000, name: "Ismoil" },
  { email: "islombek2@discover.uz",                 debt: 250000, name: "Islombek (Navruz)" },
  { email: "abdulbosit.xamidullayev@discover.uz",   debt: 250000, name: "Xamidullayev Abdulbosit" },
  { email: "asadbek.ahmadjanov@discover.uz",        debt: 100000, name: "Ahmadjanov Asadbek" },
  { email: "ahrorbek@discover.uz",                  debt: 250000, name: "Ahrorbek" },

  // Rus tili N (Shahnoza)
  { email: "mohinur.sirojiddinova@discover.uz",     debt: 250000, name: "Sirojiddinova Mohinur" },
  { email: "nodira.sirojiddinova@discover.uz",      debt: 200000, name: "Sirojiddinova Nodira" },
  { email: "rayxona.urayimova@discover.uz",         debt: 250000, name: "Urayimova Rayxona" },
  { email: "hadicha@discover.uz",                   debt: 200000, name: "Hadicha" },
  { email: "xilola.xusanboyeva@discover.uz",        debt: 200000, name: "Xusanboyeva Xilola" },
  { email: "begoyim@discover.uz",                   debt: 300000, name: "Begoyim" },

  // Bekzod group
  { email: "bekzod.izzatullayev@discover.uz",       debt: 300000, name: "Bekzod Izzatullayev" },
  { email: "abubakr.usmanov@discover.uz",           debt: 300000, name: "Usmanov Abubakr" },
  { email: "xondamir.karimjanov@discover.uz",       debt: 300000, name: "Karimjanov Xondamir" },
  { email: "charos@discover.uz",                    debt: 300000, name: "Charos" },
  { email: "muhammadyunus@discover.uz",             debt: 150000, name: "Muhammadyunus" },

  // Doniyor group
  { email: "rayxona@discover.uz",                   debt: 400000, name: "Rayxona (Doniyor)" },
  { email: "marxabo@discover.uz",                   debt: 350000, name: "Marxabo" },

  // Elbek group
  { email: "abdulhoshim.abduganiyev@discover.uz",   debt: 300000, name: "Abduganiyev Abdulhoshim" },
];

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const results: { name: string; email: string; debt: number; updated: boolean }[] = [];

    for (const d of DEBTS) {
      // Get student id via user email join
      const { rows } = await client.query(`
        SELECT s.id
        FROM students s
        JOIN users u ON u.id = s."userId"
        WHERE u.email = $1
      `, [d.email]);

      if (rows.length === 0) {
        results.push({ name: d.name, email: d.email, debt: d.debt, updated: false });
        continue;
      }

      await client.query(`
        UPDATE students SET balance = $1, "updatedAt" = NOW() WHERE id = $2
      `, [-d.debt, rows[0].id]);

      results.push({ name: d.name, email: d.email, debt: d.debt, updated: true });
    }

    await client.query("COMMIT");

    const updated = results.filter(r => r.updated).length;
    const missed  = results.filter(r => !r.updated);

    return NextResponse.json({
      success: true,
      updated,
      totalDebt: DEBTS.reduce((s, d) => s + d.debt, 0),
      missed,
    });
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}

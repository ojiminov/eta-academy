import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email") || "aziz@student.uz";
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });

  try {
    const result = await pool.query(
      `SELECT id, email, role, "isActive", LENGTH("passwordHash") as hash_length, "firstName", "lastName" FROM users WHERE email = $1`,
      [email]
    );
    return NextResponse.json(result.rows[0] || { error: "User not found" });
  } finally {
    await pool.end();
  }
}

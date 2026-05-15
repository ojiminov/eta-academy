import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
function newId() { return randomBytes(12).toString("base64url"); }

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
    return NextResponse.json(expenses);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { title, amount, category, description, date } = await req.json();
    if (!title || amount == null) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    const expense = await prisma.expense.create({
      data: {
        id: newId(),
        title,
        amount: parsedAmount,
        category: category || "OTHER",
        description: description || null,
        date: date ? new Date(date) : new Date(),
      }
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

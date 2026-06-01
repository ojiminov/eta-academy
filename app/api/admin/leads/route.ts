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
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(leads);
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
    const body = await req.json();
    const { firstName, lastName, phone, email, source, status, interestedLevel, trialDate, notes } = body;
    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }
    const lead = await prisma.lead.create({
      data: {
        id: newId(),
        firstName, lastName, phone,
        email: email || null,
        source: source || "OTHER",
        status: status || "LEAD",
        interestedLevel: interestedLevel || null,
        trialDate: trialDate ? new Date(trialDate) : null,
        notes: notes || null,
      }
    });
    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, firstName, lastName, phone, email, source, status, interestedLevel, trialDate, notes } = await req.json();
    const data = { firstName, lastName, phone, email, source, status, interestedLevel, trialDate, notes };
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...Object.fromEntries(Object.entries(data).filter(([,v]) => v !== undefined)),
        trialDate: trialDate ? new Date(trialDate) : undefined,
        updatedAt: new Date(),
      }
    });
    return NextResponse.json(lead);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

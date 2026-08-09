import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  const rows = await db.reservation.findMany({
    where: { restaurant: { slug: "the-burgundy-by-chef-stone" } },
    include: { customer: true },
    orderBy: { dateTime: "asc" },
    take: 100
  });
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id || !body.status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  const allowed = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW", "WAITLISTED"];
  if (!allowed.includes(body.status)) return NextResponse.json({ error: "invalid status" }, { status: 400 });
  const row = await db.reservation.update({
    where: { id: String(body.id) },
    data: { status: body.status }
  });
  return NextResponse.json(row);
}

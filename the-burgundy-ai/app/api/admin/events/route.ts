import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  const rows = await db.eventInquiry.findMany({
    where: { restaurant: { slug: "the-burgundy-by-chef-stone" } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const allowed = ["NEW", "CONTACTED", "QUALIFIED", "BOOKED", "LOST"];
  if (!body.id || !allowed.includes(body.status)) return NextResponse.json({ error: "invalid request" }, { status: 400 });
  const row = await db.eventInquiry.update({
    where: { id: String(body.id) },
    data: { status: body.status }
  });
  return NextResponse.json(row);
}

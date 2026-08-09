import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { generateRestaurantReply } from "@/lib/agent";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = String(body.message || "").trim();
  const phone = String(body.phone || "demo-web");
  if (!text) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const restaurant = await db.restaurant.findUnique({ where: { slug: "the-burgundy-by-chef-stone" } });
  if (!restaurant) return NextResponse.json({ error: "restaurant not seeded" }, { status: 500 });

  const customer = await db.customer.upsert({
    where: { restaurantId_whatsappNumber: { restaurantId: restaurant.id, whatsappNumber: phone } },
    update: {},
    create: { restaurantId: restaurant.id, whatsappNumber: phone }
  });

  let conversation = await db.conversation.findFirst({
    where: { restaurantId: restaurant.id, customerId: customer.id, status: "OPEN" },
    orderBy: { updatedAt: "desc" }
  });
  if (!conversation) conversation = await db.conversation.create({ data: { restaurantId: restaurant.id, customerId: customer.id } });

  await db.message.create({ data: { conversationId: conversation.id, role: "USER", content: text } });

  const rows = await db.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "asc" }, take: 30 });
  const history = rows.map(m => ({
    role: (m.role === "ASSISTANT" ? "assistant" : "user") as "assistant" | "user",
    content: m.content
  }));

  const reply = await generateRestaurantReply(history, {
    restaurantId: restaurant.id,
    customerId: customer.id
  });

  await db.message.create({ data: { conversationId: conversation.id, role: "ASSISTANT", content: reply } });
  return NextResponse.json({ reply, conversationId: conversation.id });
}

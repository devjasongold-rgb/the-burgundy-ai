import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/prisma";
import { generateRestaurantReply } from "@/lib/agent";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { claimWebhookEvent, markWebhookProcessed } from "@/lib/webhook";

function verifySignature(raw: string, signature: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!signature?.startsWith("sha256=")) return false;
  const received = signature.slice(7);
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: any;
  try { body = JSON.parse(raw); } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!message) return NextResponse.json({ ok: true });

  const externalId = String(message.id || `${Date.now()}-${message.from}`);
  const restaurant = await db.restaurant.findUnique({
    where: { slug: "the-burgundy-by-chef-stone" }
  });
  if (!restaurant) return NextResponse.json({ ok: false }, { status: 500 });

  const claimed = await claimWebhookEvent({
    restaurantId: restaurant.id,
    provider: "whatsapp",
    externalId,
    eventType: message.type,
    payload: body
  });
  if (!claimed) return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (message.type !== "text") {
      await sendWhatsAppText(String(message.from), "I can help with reservations, dining questions and private-event enquiries. Please send your request as a message.");
      await markWebhookProcessed(claimed.id);
      return NextResponse.json({ ok: true });
    }

    const from = String(message.from);
    const text = String(message.text?.body || "").trim();
    if (!text) return NextResponse.json({ ok: true });

    const customer = await db.customer.upsert({
      where: { restaurantId_whatsappNumber: { restaurantId: restaurant.id, whatsappNumber: from } },
      update: {},
      create: { restaurantId: restaurant.id, whatsappNumber: from }
    });

    let conversation = await db.conversation.findFirst({
      where: { restaurantId: restaurant.id, customerId: customer.id, status: "OPEN" },
      orderBy: { updatedAt: "desc" }
    });
    if (!conversation) {
      conversation = await db.conversation.create({
        data: { restaurantId: restaurant.id, customerId: customer.id }
      });
    }

    await db.message.create({
      data: { conversationId: conversation.id, role: "USER", content: text, whatsappId: externalId }
    });

    const rows = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 30
    });

    const history = rows.map(m => ({
      role: (m.role === "ASSISTANT" ? "assistant" : "user") as "assistant" | "user",
      content: m.content
    }));

    const reply = await generateRestaurantReply(history, {
      restaurantId: restaurant.id,
      customerId: customer.id
    });

    await db.message.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: reply }
    });

    await sendWhatsAppText(from, reply);
    await markWebhookProcessed(claimed.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("WhatsApp webhook processing failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

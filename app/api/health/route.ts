import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "The Burgundy AI",
    whatsappConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    databaseConfigured: Boolean(process.env.DATABASE_URL)
  });
}

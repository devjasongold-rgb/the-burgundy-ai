import { db } from "./prisma";

export async function claimWebhookEvent(args: {
  restaurantId: string;
  provider: string;
  externalId: string;
  eventType?: string;
  payload: unknown;
}) {
  try {
    return await db.webhookEvent.create({
      data: {
        restaurantId: args.restaurantId,
        provider: args.provider,
        externalId: args.externalId,
        eventType: args.eventType,
        payload: args.payload as object
      }
    });
  } catch {
    // Unique constraint means Meta retried an event we already accepted.
    return null;
  }
}

export async function markWebhookProcessed(id: string) {
  return db.webhookEvent.update({
    where: { id },
    data: { processedAt: new Date() }
  });
}

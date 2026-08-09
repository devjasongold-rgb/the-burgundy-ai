import { db } from "./prisma";

export type AvailabilityResult = {
  available: boolean;
  capacity: number;
  occupied: number;
  requested: number;
  source: "internal-capacity" | "external";
  provider?: string;
};

export type CreateReservationResult =
  | { ok: true; reservationId: string; provider: string }
  | { ok: false; reason: string };

export interface ReservationProvider {
  name: string;
  checkAvailability(input: {
    restaurantId: string;
    dateTime: Date;
    guestCount: number;
  }): Promise<AvailabilityResult>;
  createReservation(input: {
    restaurantId: string;
    customerId: string;
    dateTime: Date;
    guestCount: number;
    occasion?: string;
    tableZone?: string;
    notes?: string;
  }): Promise<CreateReservationResult>;
}

class InternalCapacityProvider implements ReservationProvider {
  name = "internal-capacity";

  async checkAvailability(input: {
    restaurantId: string;
    dateTime: Date;
    guestCount: number;
  }): Promise<AvailabilityResult> {
    const restaurant = await db.restaurant.findUnique({ where: { id: input.restaurantId } });
    if (!restaurant) throw new Error("Restaurant not found");

    const start = new Date(input.dateTime.getTime() - 90 * 60 * 1000);
    const end = new Date(input.dateTime.getTime() + 90 * 60 * 1000);

    const active = await db.reservation.findMany({
      where: {
        restaurantId: input.restaurantId,
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gte: start, lte: end }
      }
    });

    const occupied = active.reduce((sum, r) => sum + r.guestCount, 0);
    const capacity = restaurant.seatCapacity ?? 70;

    return {
      available: occupied + input.guestCount <= capacity,
      capacity,
      occupied,
      requested: input.guestCount,
      source: "internal-capacity"
    };
  }

  async createReservation(input: {
    restaurantId: string;
    customerId: string;
    dateTime: Date;
    guestCount: number;
    occasion?: string;
    tableZone?: string;
    notes?: string;
  }): Promise<CreateReservationResult> {
    const check = await this.checkAvailability(input);
    if (!check.available) return { ok: false, reason: "NO_CAPACITY" };

    const reservation = await db.reservation.create({
      data: {
        restaurantId: input.restaurantId,
        customerId: input.customerId,
        guestCount: input.guestCount,
        dateTime: input.dateTime,
        status: "CONFIRMED",
        occasion: input.occasion,
        tableZone: input.tableZone,
        notes: input.notes,
        provider: this.name
      }
    });

    return { ok: true, reservationId: reservation.id, provider: this.name };
  }
}

/**
 * Adapter boundary for OpenTable/Resy/SevenRooms/custom host-stand APIs.
 * The application talks only to this interface, so the provider can be swapped
 * without rewriting the AI layer.
 */
export function getReservationProvider(): ReservationProvider {
  // v0.3 intentionally defaults to the safe internal provider.
  // A real provider adapter can be selected with RESERVATION_PROVIDER once its API credentials are configured.
  return new InternalCapacityProvider();
}

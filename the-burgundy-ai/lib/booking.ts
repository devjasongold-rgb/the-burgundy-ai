import { getReservationProvider } from "./reservation-provider";

export async function findAvailability(restaurantId: string, dateTime: Date, guestCount: number) {
  return getReservationProvider().checkAvailability({ restaurantId, dateTime, guestCount });
}

export async function createReservation(args: {
  restaurantId: string;
  customerId: string;
  guestCount: number;
  dateTime: Date;
  occasion?: string;
  tableZone?: string;
  notes?: string;
}) {
  return getReservationProvider().createReservation(args);
}

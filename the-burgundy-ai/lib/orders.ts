import { db } from "./prisma";

type CartLine = {
  menuItemId: string;
  quantity: number;
  modifiers?: unknown;
  notes?: string;
};

export async function previewOrder(args: {
  restaurantId: string;
  fulfillmentType: "PICKUP" | "DELIVERY" | "DINE_IN";
  items: CartLine[];
  deliveryAddress?: string;
}) {
  if (!args.items.length) return { ok: false as const, reason: "EMPTY_CART" };

  const ids = [...new Set(args.items.map(i => i.menuItemId))];
  const menu = await db.menuItem.findMany({
    where: { restaurantId: args.restaurantId, id: { in: ids } }
  });

  const byId = new Map(menu.map(i => [i.id, i]));
  const errors: string[] = [];
  const lines = [];

  for (const item of args.items) {
    const menuItem = byId.get(item.menuItemId);
    if (!menuItem) { errors.push(`Unknown menu item ${item.menuItemId}`); continue; }
    if (!menuItem.available) { errors.push(`${menuItem.name} is currently unavailable.`); continue; }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      errors.push(`Invalid quantity for ${menuItem.name}.`);
      continue;
    }

    lines.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      modifiers: item.modifiers ?? [],
      notes: item.notes ?? null,
      lineTotal: menuItem.price * item.quantity
    });
  }

  if (errors.length) return { ok: false as const, reason: "VALIDATION_ERROR", errors };

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  // Delivery fee remains configurable; no hidden fee is added by the agent.
  const deliveryFee = args.fulfillmentType === "DELIVERY" ? 0 : 0;
  const serviceFee = 0;

  if (args.fulfillmentType === "DELIVERY" && !args.deliveryAddress?.trim()) {
    return { ok: false as const, reason: "DELIVERY_ADDRESS_REQUIRED" };
  }

  return {
    ok: true as const,
    lines,
    subtotal,
    deliveryFee,
    serviceFee,
    total: subtotal + deliveryFee + serviceFee,
    fulfillmentType: args.fulfillmentType
  };
}

export async function createOrder(args: {
  restaurantId: string;
  customerId: string;
  fulfillmentType: "PICKUP" | "DELIVERY" | "DINE_IN";
  items: CartLine[];
  deliveryAddress?: string;
  notes?: string;
}) {
  const preview = await previewOrder(args);
  if (!preview.ok) return preview;

  const order = await db.order.create({
    data: {
      restaurantId: args.restaurantId,
      customerId: args.customerId,
      status: "PENDING_PAYMENT",
      fulfillmentType: args.fulfillmentType,
      subtotal: preview.subtotal,
      deliveryFee: preview.deliveryFee,
      serviceFee: preview.serviceFee,
      total: preview.total,
      deliveryAddress: args.deliveryAddress,
      notes: args.notes,
      items: {
        create: preview.lines.map(line => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          modifiers: line.modifiers as object,
          notes: line.notes ?? undefined,
          lineTotal: line.lineTotal
        }))
      }
    },
    include: { items: { include: { menuItem: true } } }
  });

  return { ok: true as const, order };
}

export async function updateOrderStatus(id: string, status: string) {
  const allowed = ["DRAFT","PENDING_PAYMENT","CONFIRMED","ACCEPTED","PREPARING","READY","OUT_FOR_DELIVERY","COMPLETED","CANCELLED"];
  if (!allowed.includes(status)) throw new Error("Invalid order status");
  return db.order.update({ where: { id }, data: { status: status as any } });
}

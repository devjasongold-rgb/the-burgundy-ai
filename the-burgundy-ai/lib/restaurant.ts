import { db } from "./prisma";

export async function getBurgundy() {
  return db.restaurant.findUnique({
    where: { slug: "the-burgundy-by-chef-stone" },
    include: {
      menuItems: { where: { available: true }, orderBy: { sortOrder: "asc" } },
      knowledgeEntries: { where: { active: true } }
    }
  });
}

export function formatNGN(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(value);
}

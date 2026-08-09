import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const restaurant = await db.restaurant.upsert({
    where: { slug: "the-burgundy-by-chef-stone" },
    update: {},
    create: {
      name: "The Burgundy by Chef Stone",
      slug: "the-burgundy-by-chef-stone",
      city: "Abuja",
      country: "Nigeria",
      address: "990 NAL Boulevard, behind Fraser Suites, Central Area, Abuja, Nigeria",
      phone: "+234 809 411 1112",
      email: "info@theburgundyrestaurant.com",
      website: "https://theburgundyrestaurant.com",
      seatCapacity: 70,
      openingHours: {
        Wednesday: { lunch: "12:00-16:00", dinner: "18:00-23:00" },
        Thursday: { lunch: "12:00-16:00", dinner: "18:00-23:00" },
        Friday: { lunch: "12:00-16:00", dinner: "18:00-23:00" },
        Saturday: { lunch: "12:00-16:00", dinner: "18:00-23:00" },
        Sunday: { lunch: "12:00-16:00", dinner: "18:00-23:00" }
      }
    }
  });

  await db.menuItem.deleteMany({ where: { restaurantId: restaurant.id } });
  const items = [
    ["Arziki 7-Course Tasting Menu", 150000, "A seven-course Pan-African tasting journey.", ["Gluten"], ["tasting-menu"]],
    ["Wine Pairing", 200000, "Wine pairing designed to accompany the Arziki tasting experience.", [], ["wine-pairing"]]
  ];
  await db.menuItem.createMany({
    data: items.map((x, i) => ({
      restaurantId: restaurant.id,
      name: x[0] as string,
      price: x[1] as number,
      description: x[2] as string,
      allergens: x[3] as string[],
      dietaryTags: x[4] as string[],
      sortOrder: i
    }))
  });

  await db.knowledgeEntry.deleteMany({ where: { restaurantId: restaurant.id } });
  await db.knowledgeEntry.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        title: "Reservation policy",
        content: "The Burgundy is reservation-focused. The Arziki tasting experience requires a reservation. Never claim a table is available unless the live reservation integration confirms it."
      },
      {
        restaurantId: restaurant.id,
        title: "Dining experience",
        content: "The Burgundy presents a Pan-African fine-dining experience centered on contemporary interpretations of African culinary heritage. The menu changes periodically."
      },
      {
        restaurantId: restaurant.id,
        title: "Private events",
        content: "Private and corporate events can be handled as enquiries. Collect event type, date, guest count, budget if known, and special requirements, then route the lead to staff for confirmation."
      },
      {
        restaurantId: restaurant.id,
        title: "Current Arziki menu",
        content: "Current public menu includes a seven-course tasting journey: Welcome Bite, Harmattan Harvest, After The Rain, Lagos Heat, Zobo Season, River & Root, Ember Season, and Sunday Morning. Publicly listed price is ₦150,000 per person; wine pairing is ₦200,000 per person. Menu data should be updated in the dashboard when the restaurant changes its menu."
      }
    ]
  });

  console.log(`Seeded ${restaurant.name}`);
}

main().finally(() => db.$disconnect());

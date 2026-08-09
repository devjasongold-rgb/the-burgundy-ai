import { db } from "@/lib/prisma";
import { formatNGN } from "@/lib/restaurant";

export default async function Menu() {
  const restaurant = await db.restaurant.findUnique({
    where: { slug: "the-burgundy-by-chef-stone" },
    include: { menuItems: { orderBy: { sortOrder: "asc" } } }
  });
  return <main className="container"><div className="badge">Dashboard</div><h1 style={{fontFamily:"Georgia,serif"}}>Menu</h1>
    {restaurant?.menuItems.map(i => <div className="card" key={i.id} style={{margin:"12px 0",display:"flex",justifyContent:"space-between",gap:20}}>
      <div><strong>{i.name}</strong><p>{i.description}</p><small style={{color:"var(--muted)"}}>Allergens: {i.allergens.join(", ") || "None listed"} · {i.available ? "Available" : "Unavailable"}</small></div>
      <strong>{formatNGN(i.price)}</strong>
    </div>)}
  </main>;
}

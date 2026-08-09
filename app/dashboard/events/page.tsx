import { db } from "@/lib/prisma";

export default async function Events() {
  const rows = await db.eventInquiry.findMany({
    where: { restaurant: { slug: "the-burgundy-by-chef-stone" } },
    orderBy: { createdAt: "desc" }
  });
  return <main className="container"><div className="badge">Dashboard</div><h1 style={{fontFamily:"Georgia,serif"}}>Private events</h1>
    {rows.map(r => <div className="card" key={r.id} style={{margin:"12px 0"}}><strong>{r.eventType || "Event enquiry"}</strong><p>{r.name || "Unknown guest"} · {r.guestCount || "?"} guests · {r.status}</p><p>{r.notes || ""}</p></div>)}
    {!rows.length && <div className="card"><p>No event enquiries yet.</p></div>}
  </main>;
}

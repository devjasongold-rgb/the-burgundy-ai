import {db} from "@/lib/prisma";
export default async function Reservations(){
 const r=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"}});
 const rows=r?await db.reservation.findMany({where:{restaurantId:r.id},include:{customer:true},orderBy:{dateTime:"asc"},take:100}):[];
 return <main className="container"><div className="badge">Reservations</div><h1 style={{fontFamily:"Georgia,serif"}}>Table book</h1>
 <p style={{color:"var(--muted)"}}>Capacity-backed reservations with waitlist support and WhatsApp reminders.</p>
 {rows.map(x=><div className="card" key={x.id} style={{margin:"10px 0"}}><div style={{display:"flex",justifyContent:"space-between"}}><strong>{x.customer.name||x.customer.whatsappNumber}</strong><span className="badge">{x.status}</span></div><p>{x.dateTime.toLocaleString()} · {x.guestCount} guests · {x.tableZone||"Zone not specified"}</p>{x.occasion&&<p>Occasion: {x.occasion}</p>}</div>)}
 {!rows.length&&<div className="card">No reservations yet.</div>}
 </main>
}

import {db} from "@/lib/prisma";
import {formatNGN} from "@/lib/restaurant";
export default async function Orders(){
 const rows=await db.order.findMany({where:{restaurant:{slug:"the-burgundy-by-chef-stone"}},include:{customer:true,items:{include:{menuItem:true}},payments:true},orderBy:{createdAt:"desc"},take:50});
 return <main className="container"><div className="badge">Operations</div><h1 style={{fontFamily:"Georgia,serif"}}>Live orders</h1>
 <p style={{color:"var(--muted)"}}>Payment-verified orders appear here. Staff can accept, reject and move orders through the kitchen workflow.</p>
 {rows.map(o=><div className="card" key={o.id} style={{margin:"14px 0"}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}><div><strong>{o.customer.name||o.customer.whatsappNumber}</strong><div style={{color:"var(--muted)"}}>{o.fulfillmentType} · {formatNGN(o.total)}</div></div><span className="badge">{o.status}</span></div>
   <div style={{marginTop:12}}>{o.items.map(i=><div key={i.id}>{i.quantity} × {i.menuItem.name}</div>)}</div>
   <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
    {o.status==="CONFIRMED"&&<button className="btn" data-order-action="accept" data-id={o.id}>Accept</button>}
    {["ACCEPTED","PREPARING","READY","OUT_FOR_DELIVERY"].includes(o.status)&&<span className="badge">Use staff API for next status</span>}
   </div>
 </div>)}
 {!rows.length&&<div className="card"><p>No orders yet.</p></div>}
 </main>
}

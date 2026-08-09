import {db} from "@/lib/prisma";
export default async function Inventory(){
 const r=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"}});
 if(!r)return <main className="container"><div className="card">Restaurant not seeded.</div></main>;
 const [items,conn,last]=await Promise.all([
  db.menuItem.findMany({where:{restaurantId:r.id},orderBy:[{category:"asc"},{sortOrder:"asc"}]}),
  db.posConnection.findUnique({where:{restaurantId:r.id}}),
  db.inventorySync.findFirst({where:{restaurantId:r.id},orderBy:{startedAt:"desc"}})
 ]);
 return <main className="container"><div className="badge">Operations</div><h1 style={{fontFamily:"Georgia,serif"}}>Menu & inventory</h1>
 <div className="card" style={{margin:"16px 0"}}><strong>POS:</strong> {conn?.provider||"Not connected"} · <strong>Sync:</strong> {last?.status||"Never"} {last?.finishedAt?`· ${last.finishedAt.toLocaleString()}`:""}</div>
 {items.map(i=><div className="card" key={i.id} style={{margin:"10px 0",opacity:i.available?1:.6}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12}}><strong>{i.name}</strong><span className="badge">{i.available?"AVAILABLE":"OUT OF STOCK"}</span></div>
  <p style={{color:"var(--muted)"}}>{i.category||"Menu"} · External ID: {i.externalId||"not mapped"} · Stock: {i.stockQuantity==null?"unknown":i.stockQuantity}</p>
 </div>)}
 </main>
}

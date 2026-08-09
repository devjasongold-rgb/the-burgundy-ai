import Link from "next/link";
import {db} from "@/lib/prisma";
export default async function Dashboard(){
 const r=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"},include:{_count:{select:{customers:true,conversations:true,reservations:true,eventInquiries:true,orders:true}}}});
 return <main className="dashboard"><aside className="sidebar"><div className="brand" style={{marginBottom:24}}>THE BURGUNDY</div>
 <Link href="/dashboard">Overview</Link><Link href="/concierge">Concierge test</Link><Link href="/dashboard/conversations">Conversations</Link><Link href="/dashboard/reservations">Reservations</Link>
 <Link href="/dashboard/orders">Orders</Link><Link href="/dashboard/inventory">Inventory</Link><Link href="/dashboard/events">Events</Link><Link href="/dashboard/menu">Menu</Link>
 </aside><section className="main"><div className="badge">Restaurant control room</div><h1 style={{fontFamily:"Georgia,serif",fontWeight:500}}>Good evening.</h1>
 <p style={{color:"var(--muted)"}}>The Burgundy AI now has payments, kitchen operations and an inventory/POS adapter boundary.</p>
 <div className="stats" style={{marginTop:26}}>{([["Customers",r?._count.customers],["Conversations",r?._count.conversations],["Reservations",r?._count.reservations],["Orders",r?._count.orders]] as const).map(x=><div className="card" key={x[0]}><span className="badge">{x[0]}</span><strong>{x[1]??0}</strong></div>)}</div>
 </section></main>
}

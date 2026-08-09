import { db } from "@/lib/prisma";

export default async function Conversations() {
  const conversations = await db.conversation.findMany({
    where: { restaurant: { slug: "the-burgundy-by-chef-stone" } },
    include: { customer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
    take: 50
  });
  return <main className="container"><div className="badge">Dashboard</div><h1 style={{fontFamily:"Georgia,serif"}}>Conversations</h1>
    {conversations.map(c => <div className="card" key={c.id} style={{margin:"12px 0"}}><strong>{c.customer.name || c.customer.whatsappNumber}</strong><p>{c.messages[0]?.content || "No messages yet"}</p></div>)}
    {!conversations.length && <div className="card"><p>No WhatsApp conversations yet. Configure Meta credentials and send a message to the connected number.</p></div>}
  </main>;
}

import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {sendWhatsAppText} from "@/lib/whatsapp";
import {requireCronSecret} from "@/lib/auth";
export async function POST(req:NextRequest){
 if(!requireCronSecret(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await req.json().catch(()=>({hoursBefore:3}));const hours=Number(b.hoursBefore||3);
 const now=new Date(),from=new Date(now.getTime()+(hours-.25)*3600000),to=new Date(now.getTime()+(hours+.25)*3600000);
 const rows=await db.reservation.findMany({where:{restaurant:{slug:"the-burgundy-by-chef-stone"},status:"CONFIRMED",dateTime:{gte:from,lte:to}},include:{customer:true}});
 let sent=0;for(const r of rows){if(!r.customer.whatsappNumber)continue;await sendWhatsAppText(r.customer.whatsappNumber,`A quick reminder from The Burgundy: your reservation for ${r.guestCount} guest${r.guestCount===1?"":"s"} is coming up at ${r.dateTime.toLocaleString()}. Reply CONFIRM to keep it, or CANCEL if your plans have changed.`);sent++;}
 return NextResponse.json({ok:true,sent});
}

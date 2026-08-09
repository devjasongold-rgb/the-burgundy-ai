import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {sendWhatsAppText} from "@/lib/whatsapp";

const messages:Record<string,string>={
 ACCEPTED:"Your Burgundy order has been accepted by the restaurant and is being prepared shortly.",
 PREPARING:"Your Burgundy order is now being prepared.",
 READY:"Your Burgundy order is ready. We’ll take care of the next step for your selected fulfillment method.",
 OUT_FOR_DELIVERY:"Your Burgundy order is on its way.",
 COMPLETED:"Your Burgundy order has been completed. Thank you for choosing The Burgundy."
};

export async function POST(req:NextRequest){
 const b=await req.json(); const order=await db.order.findUnique({where:{id:String(b.orderId)},include:{customer:true}});
 if(!order)return NextResponse.json({error:"order not found"},{status:404});
 const text=String(b.message||messages[order.status]||"There is an update to your Burgundy order.");
 if(!order.customer.whatsappNumber)return NextResponse.json({error:"customer has no WhatsApp number"},{status:400});
 await sendWhatsAppText(order.customer.whatsappNumber,text);
 return NextResponse.json({ok:true});
}

import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {initializePaystackPayment} from "@/lib/payments";

export async function POST(req:NextRequest){
 const body=await req.json();
 if(!body.orderId||!body.email) return NextResponse.json({error:"orderId and email are required"},{status:400});
 const order=await db.order.findUnique({where:{id:String(body.orderId)}});
 if(!order) return NextResponse.json({error:"Order not found"},{status:404});
 if(order.status!=="PENDING_PAYMENT") return NextResponse.json({error:"Order is not awaiting payment"},{status:409});
 const result=await initializePaystackPayment({restaurantId:order.restaurantId,orderId:order.id,email:String(body.email),amount:order.total});
 return NextResponse.json(result,result.ok?undefined:{status:503});
}

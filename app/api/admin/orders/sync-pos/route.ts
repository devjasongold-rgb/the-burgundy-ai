import {NextRequest,NextResponse} from "next/server";
import {pushConfirmedOrderToPos} from "@/lib/pos-order";
export async function POST(req:NextRequest){
 const b=await req.json(); if(!b.orderId)return NextResponse.json({error:"orderId required"},{status:400});
 const result=await pushConfirmedOrderToPos(String(b.orderId));
 return NextResponse.json(result,result.ok?undefined:{status:409});
}

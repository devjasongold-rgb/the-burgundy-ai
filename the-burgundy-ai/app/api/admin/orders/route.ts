import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {staffAcceptOrder,staffRejectOrder,staffChangeStatus,staffTakeover} from "@/lib/order-ops";
import {requireAdminSecret} from "@/lib/auth";
import {rateLimit} from "@/lib/rate-limit";

function guard(req:NextRequest){if(!requireAdminSecret(req))return NextResponse.json({error:"Unauthorized"},{status:401});const r=rateLimit(`admin:${req.headers.get("x-forwarded-for")||"unknown"}`);if(!r.allowed)return NextResponse.json({error:"Rate limit exceeded"},{status:429});}
export async function GET(req:NextRequest){
 const g=guard(req);if(g)return g;
 const status=req.nextUrl.searchParams.get("status");
 const rows=await db.order.findMany({where:{restaurant:{slug:"the-burgundy-by-chef-stone"},...(status?{status:status as any}:{})},include:{customer:true,items:{include:{menuItem:true}},payments:true},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json(rows);
}
export async function PATCH(req:NextRequest){
 const g=guard(req);if(g)return g;
 const b=await req.json();const id=String(b.id||"");const staff=b.staffName?String(b.staffName):undefined;
 if(!id)return NextResponse.json({error:"id required"},{status:400});
 try{
  if(b.action==="accept")return NextResponse.json(await staffAcceptOrder(id,staff));
  if(b.action==="reject")return NextResponse.json(await staffRejectOrder(id,String(b.reason||"Restaurant unable to fulfil order"),staff));
  if(b.action==="takeover")return NextResponse.json(await staffTakeover(id,String(b.staffName||"Staff"),b.note?String(b.note):undefined));
  if(b.action==="status")return NextResponse.json(await staffChangeStatus(id,String(b.status),staff));
  return NextResponse.json({error:"unknown action"},{status:400});
 }catch(e:any){return NextResponse.json({error:e.message||"operation failed"},{status:409});}
}

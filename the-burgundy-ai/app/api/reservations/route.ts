import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {checkReservationAvailability,createReservationSafe,cancelReservation,addToWaitlist} from "@/lib/reservations";

async function restaurant(){return db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"}})}
export async function GET(req:NextRequest){
 const r=await restaurant();if(!r)return NextResponse.json({error:"restaurant not found"},{status:404});
 const date=req.nextUrl.searchParams.get("date_time"),guests=Number(req.nextUrl.searchParams.get("guest_count")||0);
 if(date&&guests)return NextResponse.json(await checkReservationAvailability(r.id,new Date(date),guests));
 const rows=await db.reservation.findMany({where:{restaurantId:r.id},include:{customer:true},orderBy:{dateTime:"asc"},take:100});
 return NextResponse.json(rows);
}
export async function POST(req:NextRequest){
 const b=await req.json();const r=await restaurant();if(!r)return NextResponse.json({error:"restaurant not found"},{status:404});
 if(b.action==="availability")return NextResponse.json(await checkReservationAvailability(r.id,new Date(b.dateTime),Number(b.guestCount)));
 if(b.action==="waitlist")return NextResponse.json(await addToWaitlist({restaurantId:r.id,customerId:String(b.customerId),dateTime:new Date(b.dateTime),guestCount:Number(b.guestCount),notes:b.notes}));
 if(b.action==="cancel")return NextResponse.json(await cancelReservation(String(b.reservationId)));
 if(b.action==="book"){
  const out=await createReservationSafe({restaurantId:r.id,customerId:String(b.customerId),dateTime:new Date(b.dateTime),guestCount:Number(b.guestCount),name:b.name,tableZone:b.tableZone,occasion:b.occasion,notes:b.notes});
  return NextResponse.json(out,out.ok?undefined:{status:409});
 }
 return NextResponse.json({error:"unknown action"},{status:400});
}

import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {checkReservationAvailability,releaseWaitlist} from "@/lib/reservations";
import {sendWhatsAppText} from "@/lib/whatsapp";

export async function POST(req:NextRequest){
 const b=await req.json();const date=new Date(b.dateTime),guests=Number(b.guestCount);
 const r=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"}});
 if(!r)return NextResponse.json({error:"not found"},{status:404});
 const availability=await checkReservationAvailability(r.id,date,guests);
 if(!availability.available)return NextResponse.json({ok:true,offered:0,reason:"still_full"});
 const candidates=await releaseWaitlist(r.id,date);
 if(!candidates.length)return NextResponse.json({ok:true,offered:0});
 const candidate=candidates.find(x=>x.guestCount<=availability.remainingSeats)||candidates[0];
 if(candidate?.customer.whatsappNumber){
   await sendWhatsAppText(candidate.customer.whatsappNumber,`Good news from The Burgundy: a table may now be available for ${candidate.guestCount} guest${candidate.guestCount===1?"":"s"} at ${candidate.dateTime.toLocaleString()}. Reply BOOK to claim it.`);
 }
 return NextResponse.json({ok:true,offered:candidate?1:0,reservationId:candidate?.id});
}

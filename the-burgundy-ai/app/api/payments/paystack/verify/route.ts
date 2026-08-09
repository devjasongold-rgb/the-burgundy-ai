import {NextRequest,NextResponse} from "next/server";
import {verifyPaystackReference} from "@/lib/payments";
export async function GET(req:NextRequest){
 const ref=req.nextUrl.searchParams.get("reference");
 if(!ref) return NextResponse.json({error:"reference required"},{status:400});
 try{return NextResponse.json(await verifyPaystackReference(ref));}
 catch(e:any){return NextResponse.json({error:e.message||"verification failed"},{status:503});}
}

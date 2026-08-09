import {NextRequest,NextResponse} from "next/server";
import crypto from "node:crypto";
import {verifyPaystackReference} from "@/lib/payments";

export async function POST(req:NextRequest){
 const raw=await req.text();
 const secret=process.env.PAYSTACK_SECRET_KEY;
 const signature=req.headers.get("x-paystack-signature");
 if(secret){
   const expected=crypto.createHmac("sha512",secret).update(raw).digest("hex");
   if(!signature || signature.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))
     return new NextResponse("Invalid signature",{status:401});
 }
 let body:any; try{body=JSON.parse(raw)}catch{return NextResponse.json({ok:false},{status:400})}
 if(body.event==="charge.success" && body.data?.reference){
   await verifyPaystackReference(String(body.data.reference));
 }
 return NextResponse.json({ok:true});
}

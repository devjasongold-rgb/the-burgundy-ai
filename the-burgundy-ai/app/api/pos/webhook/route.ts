import {NextRequest,NextResponse} from "next/server";
import crypto from "node:crypto";
import {db} from "@/lib/prisma";
import {log,logError} from "@/lib/logger";

function validSignature(raw:string,signature:string|null){
 const secret=process.env.POS_WEBHOOK_SECRET;if(!secret)return process.env.NODE_ENV!=="production";
 if(!signature)return false;const expected=crypto.createHmac("sha256",secret).update(raw).digest("hex");
 const a=Buffer.from(signature),b=Buffer.from(expected);return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
export async function POST(req:NextRequest){
 const raw=await req.text();if(!validSignature(raw,req.headers.get("x-pos-signature")))return new NextResponse("Invalid signature",{status:401});
 let body:any;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:"invalid json"},{status:400})}
 const r=await db.restaurant.findUnique({where:{slug:String(body.restaurantSlug||"the-burgundy-by-chef-stone")}});if(!r)return NextResponse.json({error:"restaurant not found"},{status:404});
 const externalId=String(body.eventId||body.id||crypto.createHash("sha256").update(raw).digest("hex"));
 try{await db.webhookEvent.create({data:{restaurantId:r.id,provider:String(body.provider||"pos"),externalId,eventType:String(body.type||"inventory.updated"),payload:body,processedAt:new Date()}});}
 catch(e:any){if(e.code==="P2002")return NextResponse.json({ok:true,duplicate:true});logError("pos_webhook_claim_failed",e);return NextResponse.json({error:"could not claim event"},{status:500});}
 const records=Array.isArray(body.items)?body.items:(body.item?[body.item]:[]);let updated=0;
 for(const x of records){const external=String(x.externalId??x.id??x.sku);const local=await db.menuItem.findFirst({where:{restaurantId:r.id,externalId:external}});if(!local)continue;const stock=x.stockQuantity==null?null:Number(x.stockQuantity);await db.menuItem.update({where:{id:local.id},data:{available:Boolean(x.available??(stock==null||stock>0)),stockQuantity:stock,...(x.price!=null?{price:Number(x.price)}:{}),...(x.modifiers!==undefined?{modifiers:x.modifiers}: {})}});updated++;}
 log("pos_inventory_webhook_processed",{restaurantId:r.id,externalId,updated});return NextResponse.json({ok:true,updated});
}

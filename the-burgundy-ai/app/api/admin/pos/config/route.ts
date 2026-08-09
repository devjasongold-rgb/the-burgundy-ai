import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/prisma";

export async function GET(){
 const r=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"},include:{posConnection:true}});
 if(!r)return NextResponse.json({error:"not found"},{status:404});
 return NextResponse.json(r.posConnection?{...r.posConnection,encryptedCredentials:undefined}:{connected:false});
}
export async function POST(req:NextRequest){
 const b=await req.json();
 const r=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"}});
 if(!r)return NextResponse.json({error:"not found"},{status:404});
 if(!b.provider||!b.baseUrl)return NextResponse.json({error:"provider and baseUrl required"},{status:400});
 const row=await db.posConnection.upsert({
  where:{restaurantId:r.id},
  update:{provider:String(b.provider),baseUrl:String(b.baseUrl),active:Boolean(b.active??true),encryptedCredentials:b.credentials?JSON.stringify(b.credentials):undefined},
  create:{restaurantId:r.id,provider:String(b.provider),baseUrl:String(b.baseUrl),active:Boolean(b.active??true),encryptedCredentials:b.credentials?JSON.stringify(b.credentials):undefined}
 });
 return NextResponse.json({...row,encryptedCredentials:undefined});
}

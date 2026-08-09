import {NextResponse} from "next/server";
import {NextRequest} from "next/server";
import {db} from "@/lib/prisma";
import {getPosAdapter} from "@/lib/pos";
import {requireAdminSecret} from "@/lib/auth";
export async function POST(req:NextRequest){
 if(!requireAdminSecret(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 const r=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"}});if(!r)return NextResponse.json({error:"not found"},{status:404});
 const adapter=await getPosAdapter(r.id);const health=await adapter.health();return NextResponse.json({provider:adapter.provider,...health},health.ok?undefined:{status:503});
}

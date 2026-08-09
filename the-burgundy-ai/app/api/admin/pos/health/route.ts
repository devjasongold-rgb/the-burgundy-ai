import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {getPosAdapter} from "@/lib/pos";
export async function GET(){
 const r=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"}});
 if(!r)return NextResponse.json({error:"not found"},{status:404});
 const adapter=await getPosAdapter(r.id);
 return NextResponse.json({provider:adapter.provider,...await adapter.health()});
}

import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {syncRestaurantInventory} from "@/lib/inventory-sync";
import {requireAdminSecret} from "@/lib/auth";
export async function POST(req:NextRequest){
 if(!requireAdminSecret(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await req.json().catch(()=>({}));
 const restaurant=await db.restaurant.findUnique({where:{slug:String(body.slug||"the-burgundy-by-chef-stone")}});
 if(!restaurant)return NextResponse.json({error:"restaurant not found"},{status:404});
 return NextResponse.json(await syncRestaurantInventory(restaurant.id));
}

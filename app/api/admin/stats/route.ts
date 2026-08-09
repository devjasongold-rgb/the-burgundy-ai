import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";
export async function GET(){
 const restaurant=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"}});
 if(!restaurant)return NextResponse.json({error:"not found"},{status:404});
 const grouped=await db.order.groupBy({by:["status"],where:{restaurantId:restaurant.id}});
 return NextResponse.json({ordersByStatus:Object.fromEntries(grouped.map(x=>[x.status,x._count._all]))});
}

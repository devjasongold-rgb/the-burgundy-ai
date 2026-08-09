import {NextResponse} from "next/server";
import {NextRequest} from "next/server";
import {db} from "@/lib/prisma";
import {requireAdminSecret} from "@/lib/auth";
export async function GET(req:NextRequest){
 if(!requireAdminSecret(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 const restaurant=await db.restaurant.findUnique({where:{slug:"the-burgundy-by-chef-stone"}});
 if(!restaurant)return NextResponse.json({error:"not found"},{status:404});
 const [items,connection,runs]=await Promise.all([
  db.menuItem.findMany({where:{restaurantId:restaurant.id},orderBy:[{category:"asc"},{sortOrder:"asc"}]}),
  db.posConnection.findUnique({where:{restaurantId:restaurant.id}}),
  db.inventorySync.findMany({where:{restaurantId:restaurant.id},orderBy:{startedAt:"desc"},take:20})
 ]);
 return NextResponse.json({items,connection:connection?{id:connection.id,provider:connection.provider,baseUrl:connection.baseUrl,active:connection.active,lastSyncAt:connection.lastSyncAt,syncStatus:connection.syncStatus,lastError:connection.lastError}:null,runs});
}

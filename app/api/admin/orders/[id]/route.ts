import {NextResponse} from "next/server";
import {getOrderWithHistory} from "@/lib/order-ops";
export async function GET(_:Request,{params}:{params:{id:string}}){
 const row=await getOrderWithHistory(params.id);
 if(!row)return NextResponse.json({error:"not found"},{status:404});
 return NextResponse.json(row);
}

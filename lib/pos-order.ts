import {db} from "./prisma";
import {getPosAdapter} from "./pos";

export async function pushConfirmedOrderToPos(orderId:string){
 const order=await db.order.findUnique({where:{id:orderId},include:{restaurant:true,customer:true,items:{include:{menuItem:true}}}});
 if(!order) return {ok:false as const,reason:"ORDER_NOT_FOUND"};
 if(order.status!=="CONFIRMED") return {ok:false as const,reason:"ORDER_NOT_CONFIRMED"};
 if(order.externalOrderId) return {ok:true as const,externalOrderId:order.externalOrderId,alreadySynced:true};
 const adapter=await getPosAdapter(order.restaurantId);
 const result=await adapter.createOrder({
   externalId:order.id,customerName:order.customer.name||undefined,customerPhone:order.customer.whatsappNumber,
   total:order.total,items:order.items.map(i=>({externalId:i.menuItem.externalId||i.menuItem.id,quantity:i.quantity,modifiers:i.modifiers,notes:i.notes||undefined}))
 });
 if(!result.ok){
   await db.staffAction.create({data:{restaurantId:order.restaurantId,orderId,action:"POS_SYNC_FAILED",details:result}});
   return result;
 }
 await db.order.update({where:{id:orderId},data:{externalOrderId:result.externalOrderId}});
 return result;
}

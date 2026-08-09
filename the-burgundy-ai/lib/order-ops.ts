import { db } from "./prisma";

const transitions: Record<string,string[]> = {
  CONFIRMED:["ACCEPTED","CANCELLED"],
  ACCEPTED:["PREPARING","CANCELLED"],
  PREPARING:["READY","CANCELLED"],
  READY:["OUT_FOR_DELIVERY","COMPLETED"],
  OUT_FOR_DELIVERY:["COMPLETED"],
};

export async function staffAcceptOrder(orderId:string, staffName?:string){
 const order=await db.order.findUnique({where:{id:orderId}});
 if(!order) throw new Error("ORDER_NOT_FOUND");
 if(order.status!=="CONFIRMED") throw new Error("ONLY_CONFIRMED_ORDERS_CAN_BE_ACCEPTED");
 return db.$transaction([
  db.order.update({where:{id:orderId},data:{status:"ACCEPTED",acceptedAt:new Date(),rejectedAt:null,rejectionReason:null}}),
  db.staffAction.create({data:{restaurantId:order.restaurantId,orderId,action:"ORDER_ACCEPTED",staffName}})
 ]);
}

export async function staffRejectOrder(orderId:string,reason:string,staffName?:string){
 const order=await db.order.findUnique({where:{id:orderId}});
 if(!order) throw new Error("ORDER_NOT_FOUND");
 if(!["CONFIRMED","ACCEPTED"].includes(order.status)) throw new Error("ORDER_CANNOT_BE_REJECTED");
 return db.$transaction([
  db.order.update({where:{id:orderId},data:{status:"CANCELLED",rejectedAt:new Date(),rejectionReason:reason}}),
  db.staffAction.create({data:{restaurantId:order.restaurantId,orderId,action:"ORDER_REJECTED",staffName,details:{reason}}})
 ]);
}

export async function staffChangeStatus(orderId:string,next:string,staffName?:string){
 const order=await db.order.findUnique({where:{id:orderId}});
 if(!order) throw new Error("ORDER_NOT_FOUND");
 const allowed=transitions[order.status]||[];
 if(!allowed.includes(next)) throw new Error(`INVALID_TRANSITION_${order.status}_TO_${next}`);
 return db.$transaction([
  db.order.update({where:{id:orderId},data:{status:next as any}}),
  db.staffAction.create({data:{restaurantId:order.restaurantId,orderId,action:"STATUS_CHANGED",staffName,details:{from:order.status,to:next}}})
 ]);
}

export async function staffTakeover(orderId:string,staffName:string,note?:string){
 const order=await db.order.findUnique({where:{id:orderId}});
 if(!order) throw new Error("ORDER_NOT_FOUND");
 return db.staffAction.create({data:{restaurantId:order.restaurantId,orderId,action:"STAFF_TAKEOVER",staffName,details:{note:note||null}}});
}

export async function getOrderWithHistory(orderId:string){
 return db.order.findUnique({where:{id:orderId},include:{customer:true,items:{include:{menuItem:true}},payments:true,staffActions:{orderBy:{createdAt:"asc"}}}});
}

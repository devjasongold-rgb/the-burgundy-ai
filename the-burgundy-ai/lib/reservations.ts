import {db} from "./prisma";

export async function checkReservationAvailability(restaurantId:string,dateTime:Date,guestCount:number){
 const restaurant=await db.restaurant.findUnique({where:{id:restaurantId}});
 if(!restaurant)return {available:false,reason:"RESTAURANT_NOT_FOUND"};
 const existing=await db.reservation.findMany({where:{restaurantId,dateTime:{gte:new Date(dateTime.getTime()-90*60000),lte:new Date(dateTime.getTime()+90*60000)},status:{in:["PENDING","CONFIRMED"]}}});
 const used=existing.reduce((n,r)=>n+r.guestCount,0);
 const capacity=restaurant.seatCapacity||0;
 return {available:capacity>0 && used+guestCount<=capacity,capacity,usedSeats:used,remainingSeats:Math.max(0,capacity-used),requestedSeats:guestCount};
}
export async function createReservationSafe(args:{restaurantId:string;customerId:string;dateTime:Date;guestCount:number;name?:string;tableZone?:string;occasion?:string;notes?:string}){
 const availability=await checkReservationAvailability(args.restaurantId,args.dateTime,args.guestCount);
 if(!availability.available)return {ok:false as const,reason:"NO_AVAILABILITY",availability};
 const row=await db.$transaction(async tx=>{
   const customer=await tx.customer.findUnique({where:{id:args.customerId}});
   if(customer && args.name && !customer.name) await tx.customer.update({where:{id:customer.id},data:{name:args.name}});
   return tx.reservation.create({data:{
     restaurantId:args.restaurantId,customerId:args.customerId,dateTime:args.dateTime,guestCount:args.guestCount,
     status:"CONFIRMED",tableZone:args.tableZone,occasion:args.occasion,notes:args.notes,provider:"internal-capacity"
   }});
 });
 return {ok:true as const,reservation:row};
}
export async function cancelReservation(id:string){
 const r=await db.reservation.findUnique({where:{id}});
 if(!r)return {ok:false as const,reason:"NOT_FOUND"};
 if(!["PENDING","CONFIRMED"].includes(r.status))return {ok:false as const,reason:"NOT_CANCELLABLE"};
 return {ok:true as const,reservation:await db.reservation.update({where:{id},data:{status:"CANCELLED"}})};
}
export async function addToWaitlist(args:{restaurantId:string;customerId:string;dateTime:Date;guestCount:number;notes?:string}){
 const row=await db.reservation.create({data:{restaurantId:args.restaurantId,customerId:args.customerId,dateTime:args.dateTime,guestCount:args.guestCount,status:"WAITLISTED",notes:args.notes}});
 return {ok:true as const,reservation:row};
}
export async function releaseWaitlist(restaurantId:string,dateTime:Date){
 const candidates=await db.reservation.findMany({where:{restaurantId,status:"WAITLISTED",dateTime:{gte:new Date(dateTime.getTime()-10*60000),lte:new Date(dateTime.getTime()+10*60000)}},orderBy:{createdAt:"asc"},include:{customer:true}});
 return candidates;
}

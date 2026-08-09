import { db } from "./prisma";
import { createReservation, findAvailability } from "./booking";
import { createOrder, previewOrder } from "./orders";
import { initializePaystackPayment } from "./payments";

export const toolDefinitions = [
 {type:"function" as const,function:{name:"check_reservation_availability",description:"Check reservation capacity.",parameters:{type:"object",properties:{date_time:{type:"string"},guest_count:{type:"integer",minimum:1}},required:["date_time","guest_count"]}}},
 {type:"function" as const,function:{name:"create_reservation",description:"Create a confirmed reservation after availability is confirmed.",parameters:{type:"object",properties:{date_time:{type:"string"},guest_count:{type:"integer",minimum:1},occasion:{type:"string"},table_zone:{type:"string"},notes:{type:"string"}},required:["date_time","guest_count"]}}},
 {type:"function" as const,function:{name:"preview_order",description:"Validate menu availability, modifiers and calculate the transparent total. Use this before asking for payment.",parameters:{type:"object",properties:{fulfillment_type:{type:"string",enum:["PICKUP","DELIVERY","DINE_IN"]},items:{type:"array",items:{type:"object",properties:{menu_item_id:{type:"string"},quantity:{type:"integer"},modifiers:{type:"array"},notes:{type:"string"}},required:["menu_item_id","quantity"]}},delivery_address:{type:"string"}},required:["fulfillment_type","items"]}}},
 {type:"function" as const,function:{name:"create_order",description:"Create an order only after the customer explicitly confirms the complete order and total. It remains PENDING_PAYMENT.",parameters:{type:"object",properties:{fulfillment_type:{type:"string",enum:["PICKUP","DELIVERY","DINE_IN"]},items:{type:"array",items:{type:"object",properties:{menu_item_id:{type:"string"},quantity:{type:"integer"},modifiers:{type:"array"},notes:{type:"string"}},required:["menu_item_id","quantity"]}},delivery_address:{type:"string"},notes:{type:"string"}},required:["fulfillment_type","items"]}}},
 {type:"function" as const,function:{name:"create_payment_link",description:"Create a secure Paystack payment link for an existing pending-payment order after the customer has confirmed the order total.",parameters:{type:"object",properties:{order_id:{type:"string"},email:{type:"string"}},required:["order_id","email"]}}},
 {type:"function" as const,function:{name:"create_event_inquiry",description:"Create a private/corporate event lead.",parameters:{type:"object",properties:{name:{type:"string"},event_type:{type:"string"},event_date:{type:"string"},guest_count:{type:"integer"},budget:{type:"integer"},notes:{type:"string"}},required:["event_type","guest_count"]}}}
];

export async function executeTool(name:string,args:Record<string,unknown>,restaurantId:string,customerId:string){
 if(name==="check_reservation_availability") return findAvailability(restaurantId,new Date(String(args.date_time)),Number(args.guest_count));
 if(name==="create_reservation") return createReservation({restaurantId,customerId,dateTime:new Date(String(args.date_time)),guestCount:Number(args.guest_count),occasion:args.occasion?String(args.occasion):undefined,tableZone:args.table_zone?String(args.table_zone):undefined,notes:args.notes?String(args.notes):undefined});
 if(name==="preview_order"||name==="create_order"){
   const items=(Array.isArray(args.items)?args.items:[]).map((x:any)=>({menuItemId:String(x.menu_item_id),quantity:Number(x.quantity),modifiers:x.modifiers,notes:x.notes?String(x.notes):undefined}));
   const base={restaurantId,customerId,fulfillmentType:String(args.fulfillment_type) as any,items,deliveryAddress:args.delivery_address?String(args.delivery_address):undefined,notes:args.notes?String(args.notes):undefined};
   return name==="preview_order"?previewOrder(base):createOrder(base);
 }
 if(name==="create_payment_link"){
   const order=await db.order.findUnique({where:{id:String(args.order_id)}});
   if(!order||order.restaurantId!==restaurantId)return {ok:false,reason:"ORDER_NOT_FOUND"};
   if(order.status!=="PENDING_PAYMENT")return {ok:false,reason:"ORDER_NOT_AWAITING_PAYMENT"};
   return initializePaystackPayment({restaurantId,orderId:order.id,email:String(args.email),amount:order.total});
 }
 if(name==="create_event_inquiry"){
   const row=await db.eventInquiry.create({data:{restaurantId,name:args.name?String(args.name):undefined,eventType:String(args.event_type),eventDate:args.event_date?new Date(String(args.event_date)):undefined,guestCount:args.guest_count?Number(args.guest_count):undefined,budget:args.budget?Number(args.budget):undefined,notes:args.notes?String(args.notes):undefined}});
   return {ok:true,inquiryId:row.id,status:row.status};
 }
 throw new Error(`Unknown tool: ${name}`);
}

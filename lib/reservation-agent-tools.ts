import {db} from "./prisma";
import {checkReservationAvailability,createReservationSafe,cancelReservation,addToWaitlist} from "./reservations";

export const reservationTools=[
 {type:"function" as const,function:{name:"check_table_availability",description:"Check live internal reservation capacity before offering a table.",parameters:{type:"object",properties:{date_time:{type:"string"},guest_count:{type:"integer",minimum:1}},required:["date_time","guest_count"]}}},
 {type:"function" as const,function:{name:"book_table",description:"Book a table only after date, time, guest count and customer details are known. Do not use until the customer clearly asks to confirm/book.",parameters:{type:"object",properties:{date_time:{type:"string"},guest_count:{type:"integer",minimum:1},name:{type:"string"},table_zone:{type:"string"},occasion:{type:"string"},notes:{type:"string"}},required:["date_time","guest_count","name"]}}},
 {type:"function" as const,function:{name:"join_waitlist",description:"Add the customer to the waitlist when requested availability is unavailable.",parameters:{type:"object",properties:{date_time:{type:"string"},guest_count:{type:"integer",minimum:1},notes:{type:"string"}},required:["date_time","guest_count"]}}},
 {type:"function" as const,function:{name:"cancel_reservation",description:"Cancel an existing Burgundy reservation using its reservation ID.",parameters:{type:"object",properties:{reservation_id:{type:"string"}},required:["reservation_id"]}}}
];
export async function executeReservationTool(name:string,args:any,restaurantId:string,customerId:string){
 if(name==="check_table_availability")return checkReservationAvailability(restaurantId,new Date(args.date_time),Number(args.guest_count));
 if(name==="book_table")return createReservationSafe({restaurantId,customerId,dateTime:new Date(args.date_time),guestCount:Number(args.guest_count),name:String(args.name),tableZone:args.table_zone,occasion:args.occasion,notes:args.notes});
 if(name==="join_waitlist")return addToWaitlist({restaurantId,customerId,dateTime:new Date(args.date_time),guestCount:Number(args.guest_count),notes:args.notes});
 if(name==="cancel_reservation")return cancelReservation(String(args.reservation_id));
 throw new Error("UNKNOWN_RESERVATION_TOOL");
}

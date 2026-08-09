import {db} from "./prisma";
import crypto from "node:crypto";

export function hashPayload(raw:string){return crypto.createHash("sha256").update(raw).digest("hex");}
export async function claimWebhook(provider:string,externalId:string,restaurantId:string,eventType:string,payload:any){
 try{
  return await db.webhookEvent.create({data:{restaurantId,provider,externalId,eventType,payload,processedAt:new Date()}});
 }catch(e:any){
  if(e.code==="P2002") return null;
  throw e;
 }
}

import {db} from "./prisma";
import {getPosAdapter} from "./pos";

export async function syncRestaurantInventory(restaurantId:string){
 const connection=await db.posConnection.findUnique({where:{restaurantId}});
 const provider=connection?.provider||"manual";
 const run=await db.inventorySync.create({data:{restaurantId,provider,status:"RUNNING"}});
 try{
   const adapter=await getPosAdapter(restaurantId);
   const records=await adapter.fetchMenuInventory();
   let updated=0;
   for(const item of records){
     const local=await db.menuItem.findFirst({where:{restaurantId,externalId:item.externalId}});
     if(!local) continue;
     const available=item.available && (item.stockQuantity==null || item.stockQuantity>0);
     await db.menuItem.update({where:{id:local.id},data:{
       available,
       stockQuantity:item.stockQuantity??undefined,
       ...(item.price!=null?{price:item.price}:{}),
       ...(item.modifiers!==undefined?{modifiers:item.modifiers as object}:{}),
       ...(item.allergens?{allergens:item.allergens}:{}),
       ...(item.dietaryTags?{dietaryTags:item.dietaryTags}:{}),
     }});
     updated++;
   }
   await db.inventorySync.update({where:{id:run.id},data:{status:"SUCCESS",finishedAt:new Date(),recordsSeen:records.length,recordsUpdated:updated}});
   await db.posConnection.updateMany({where:{restaurantId},data:{lastSyncAt:new Date(),lastError:null,syncStatus:"SUCCESS"}});
   return {ok:true,recordsSeen:records.length,recordsUpdated:updated};
 }catch(e:any){
   await db.inventorySync.update({where:{id:run.id},data:{status:"FAILED",finishedAt:new Date(),error:e.message||"sync failed"}});
   await db.posConnection.updateMany({where:{restaurantId},data:{lastError:e.message||"sync failed",syncStatus:"FAILED"}});
   return {ok:false,reason:e.message||"sync failed"};
 }
}

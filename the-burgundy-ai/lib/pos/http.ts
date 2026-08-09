import type {PosAdapter,PosMenuRecord,PosOrderInput,PosOrderResult} from "./types";

function env(name:string){const v=process.env[name]; if(!v) throw new Error(`${name}_NOT_CONFIGURED`); return v;}
function headers(){
 const h:Record<string,string>={"Content-Type":"application/json"};
 const token=process.env.POS_API_TOKEN;
 if(token) h.Authorization=`Bearer ${token}`;
 return h;
}
async function request(path:string,init?:RequestInit){
 const base=env("POS_API_BASE_URL").replace(/\/$/,"");
 const res=await fetch(`${base}${path}`,{...init,headers:{...headers(),...(init?.headers||{})},cache:"no-store"});
 const text=await res.text(); let data:any={}; try{data=text?JSON.parse(text):{}}catch{data={raw:text}};
 if(!res.ok) throw new Error(`POS_HTTP_${res.status}:${data?.message||data?.error||text.slice(0,200)}`);
 return data;
}
export class HttpPosAdapter implements PosAdapter {
 provider="http";
 async health(){try{await request(process.env.POS_HEALTH_PATH||"/health");return {ok:true};}catch(e:any){return {ok:false,detail:e.message};}}
 async fetchMenuInventory():Promise<PosMenuRecord[]>{
   const data=await request(process.env.POS_MENU_PATH||"/menu/inventory");
   const rows=Array.isArray(data)?data:(data.items||data.data||[]);
   return rows.map((x:any)=>({
     externalId:String(x.externalId??x.id??x.sku),
     name:x.name,
     available:Boolean(x.available??(x.stockQuantity==null||x.stockQuantity>0)),
     stockQuantity:x.stockQuantity==null?null:Number(x.stockQuantity),
     price:x.price==null?undefined:Number(x.price),
     category:x.category,
     modifiers:x.modifiers,
     allergens:x.allergens||[],
     dietaryTags:x.dietaryTags||[]
   }));
 }
 async createOrder(input:PosOrderInput):Promise<PosOrderResult>{
   try{
    const data=await request(process.env.POS_ORDER_PATH||"/orders",{method:"POST",body:JSON.stringify(input)});
    return {ok:true,externalOrderId:String(data.externalOrderId??data.id??data.orderId)};
   }catch(e:any){return {ok:false,reason:e.message,retryable:/^POS_HTTP_5|ECONN|TIMEOUT/.test(e.message)};}
 }
}

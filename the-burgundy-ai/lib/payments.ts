import { db } from "./prisma";

type InitResult = { ok:true; reference:string; authorizationUrl:string; paymentId:string } | { ok:false; reason:string };

function key(name:string){ return process.env[name] || ""; }

export async function initializePaystackPayment(args:{restaurantId:string;orderId:string;email:string;amount:number}) : Promise<InitResult> {
  const secret=key("PAYSTACK_SECRET_KEY");
  if(!secret) return {ok:false,reason:"PAYSTACK_NOT_CONFIGURED"};

  const reference=`burgundy_${args.orderId}_${Date.now()}`;
  const res=await fetch("https://api.paystack.co/transaction/initialize",{
    method:"POST",headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},
    body:JSON.stringify({email:args.email,amount:args.amount*100,reference,currency:"NGN",metadata:{orderId:args.orderId,restaurantId:args.restaurantId}})
  });
  const data=await res.json();
  if(!res.ok || !data.status) return {ok:false,reason:data.message||"PAYMENT_INITIALIZATION_FAILED"};

  const p=await db.payment.create({data:{
    restaurantId:args.restaurantId,orderId:args.orderId,provider:"paystack",reference,
    amount:args.amount,currency:"NGN",status:"PENDING",authorizationUrl:data.data.authorization_url,
    metadata:data.data
  }});
  return {ok:true,reference,authorizationUrl:data.data.authorization_url,paymentId:p.id};
}

export async function verifyPaystackReference(reference:string){
  const secret=key("PAYSTACK_SECRET_KEY");
  if(!secret) throw new Error("PAYSTACK_NOT_CONFIGURED");
  const res=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{
    headers:{Authorization:`Bearer ${secret}`}
  });
  const data=await res.json();
  if(!res.ok || !data.status) throw new Error(data.message||"PAYMENT_VERIFICATION_FAILED");

  const paid=data.data.status==="success";
  const payment=await db.payment.findUnique({where:{reference}});
  if(!payment) return {paid:false,reason:"UNKNOWN_REFERENCE"};
  if(paid){
    await db.$transaction([
      db.payment.update({where:{id:payment.id},data:{status:"PAID",paidAt:new Date(),metadata:data.data}}),
      db.order.update({where:{id:payment.orderId},data:{status:"CONFIRMED"}})
    ]);
  }
  return {paid,paymentId:payment.id,orderId:payment.orderId};
}

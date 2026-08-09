import { getOpenAI } from "./openai";
import { getBurgundy, formatNGN } from "./restaurant";
import { executeTool, toolDefinitions } from "./agent-tools";

type HistoryItem={role:"user"|"assistant";content:string};

export async function generateRestaurantReply(history:HistoryItem[],context?:{restaurantId:string;customerId:string}){
 const restaurant=await getBurgundy(); if(!restaurant)throw new Error("Restaurant seed data not found");
 const menu=restaurant.menuItems.map(i=>`- ID:${i.id} | ${i.name}: ${formatNGN(i.price)}. ${i.description??""} Available:${i.available}. Allergens:${i.allergens.join(", ")||"none listed"}. Dietary:${i.dietaryTags.join(", ")||"none listed"}. Modifiers:${JSON.stringify(i.modifiers??[])}`).join("\n");
 const knowledge=restaurant.knowledgeEntries.map(k=>`### ${k.title}\n${k.content}`).join("\n\n");
 const system=`You are the WhatsApp concierge for ${restaurant.name}.
Tone: warm, polished, concise and luxurious.
Never invent prices, availability, allergens, reservation confirmation or payment confirmation.
For severe allergies tell guests to confirm directly with the restaurant.
RESERVATIONS: collect date/time, guest count and name; use availability before confirming.
ORDERS: use menu IDs from the menu. First use preview_order. Show the customer exact items, modifiers, fulfillment type and total. Ask for explicit confirmation. Only after explicit confirmation use create_order. Then collect email for payment and use create_payment_link. Never say an order is paid until a payment webhook/verification confirms it.
PAYMENT: send the customer the payment link returned by the tool. Explain that the order becomes confirmed only after payment is successfully verified.
PRIVATE EVENTS: collect event type/date/guest count and create an inquiry.
Restaurant address:${restaurant.address}; phone:${restaurant.phone}; email:${restaurant.email}.
Menu:
${menu}
Knowledge:
${knowledge}`;
 const client=getOpenAI(); let messages:any[]=[{role:"system",content:system},...history];
 for(let turn=0;turn<6;turn++){
   const r=await client.chat.completions.create({model:"gpt-5-mini",temperature:.2,messages,tools:toolDefinitions,tool_choice:"auto"});
   const m=r.choices[0]?.message;if(!m)break;
   if(m.tool_calls?.length){
     messages.push(m);
     for(const call of m.tool_calls){
       let args:any={};try{args=JSON.parse(call.function.arguments||"{}")}catch{}
       const result=context?await executeTool(call.function.name,args,context.restaurantId,context.customerId):{ok:false,reason:"LIVE_CONTEXT_REQUIRED"};
       messages.push({role:"tool",tool_call_id:call.id,content:JSON.stringify(result)});
     } continue;
   }
   return m.content?.trim()||"How may I assist you?";
 }
 return "I’m sorry, I couldn’t complete that request right now. I can connect you with The Burgundy team.";
}

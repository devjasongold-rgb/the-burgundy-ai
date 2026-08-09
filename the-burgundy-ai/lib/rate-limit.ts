type Bucket={count:number;reset:number};
const store=new Map<string,Bucket>();
export function rateLimit(key:string,limit=60,windowMs=60000){
 const now=Date.now();const old=store.get(key);
 if(!old||old.reset<=now){store.set(key,{count:1,reset:now+windowMs});return {allowed:true,remaining:limit-1};}
 old.count++;return {allowed:old.count<=limit,remaining:Math.max(0,limit-old.count)};
}

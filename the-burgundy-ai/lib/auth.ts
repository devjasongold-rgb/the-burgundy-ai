import crypto from "node:crypto";
export function requireAdminSecret(req:Request){
 const expected=process.env.ADMIN_API_SECRET;
 if(!expected) throw new Error("ADMIN_API_SECRET_NOT_CONFIGURED");
 const supplied=req.headers.get("x-admin-secret")||req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
 if(!supplied)return false;
 const a=Buffer.from(supplied),b=Buffer.from(expected);
 return a.length===b.length && crypto.timingSafeEqual(a,b);
}
export function requireCronSecret(req:Request){
 const expected=process.env.CRON_SECRET;
 if(!expected) throw new Error("CRON_SECRET_NOT_CONFIGURED");
 const supplied=req.headers.get("x-cron-secret")||req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
 if(!supplied)return false;
 const a=Buffer.from(supplied),b=Buffer.from(expected);
 return a.length===b.length && crypto.timingSafeEqual(a,b);
}

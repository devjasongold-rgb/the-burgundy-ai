export function log(event:string,data:Record<string,unknown>={}){
 console.log(JSON.stringify({ts:new Date().toISOString(),service:"burgundy-ai",event,...data}));
}
export function logError(event:string,error:unknown,data:Record<string,unknown>={}){
 console.error(JSON.stringify({ts:new Date().toISOString(),service:"burgundy-ai",event,error:error instanceof Error?error.message:String(error),...data}));
}

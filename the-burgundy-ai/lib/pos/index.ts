import {db} from "../prisma";
import {MockPosAdapter} from "./mock";
import {HttpPosAdapter} from "./http";
import type {PosAdapter} from "./types";

export async function getPosAdapter(restaurantId:string):Promise<PosAdapter>{
 const connection=await db.posConnection.findUnique({where:{restaurantId}});
 if(!connection?.active) return new MockPosAdapter();
 if(connection.provider==="http" || connection.provider==="chefstone") return new HttpPosAdapter();
 return new MockPosAdapter();
}

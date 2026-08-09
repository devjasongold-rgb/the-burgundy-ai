import type {PosAdapter,PosMenuRecord,PosOrderInput,PosOrderResult} from "./types";

export class MockPosAdapter implements PosAdapter {
 provider="mock";
 async health(){return {ok:true,detail:"Mock POS adapter active"};}
 async fetchMenuInventory():Promise<PosMenuRecord[]>{
   return [];
 }
 async createOrder(input:PosOrderInput):Promise<PosOrderResult>{
   return {ok:true,externalOrderId:`MOCK-${input.externalId}`};
 }
}

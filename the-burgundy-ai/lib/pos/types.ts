export type PosMenuRecord = {
  externalId: string;
  name?: string;
  available: boolean;
  stockQuantity?: number | null;
  price?: number;
  category?: string;
  modifiers?: unknown;
  allergens?: string[];
  dietaryTags?: string[];
};

export type PosOrderInput = {
  externalId: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    externalId: string;
    quantity: number;
    modifiers?: unknown;
    notes?: string;
  }>;
  total: number;
};

export type PosOrderResult =
  | { ok: true; externalOrderId: string }
  | { ok: false; reason: string; retryable: boolean };

export interface PosAdapter {
  provider: string;
  health(): Promise<{ok:boolean;detail?:string}>;
  fetchMenuInventory(): Promise<PosMenuRecord[]>;
  createOrder(input: PosOrderInput): Promise<PosOrderResult>;
}

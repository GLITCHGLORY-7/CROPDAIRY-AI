// CropDiary AI — Market Price Provider Interface (Agmarknet / Open Government Data)
import { MandiMarketPrice, MarketPriceQueryParams } from '@/types/finance';

export interface MarketPriceResponse {
  source: string;
  isLiveFeed: boolean;
  statusMessage: string;
  data: MandiMarketPrice[];
  totalRecords: number;
  retrievedAt: string;
}

export interface IMarketPriceProvider {
  fetchMarketPrices(params: MarketPriceQueryParams): Promise<MarketPriceResponse>;
  getCommodities(): Promise<string[]>;
  getStatesAndDistricts(): Promise<Record<string, string[]>>;
}

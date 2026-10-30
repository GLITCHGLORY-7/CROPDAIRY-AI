// CropDiary AI — Market Price Service
import { agmarknetProvider } from './agmarknetProvider';
import {
  MandiMarketPrice,
  MarketPriceQueryParams,
  SellingCalculatorInputs,
  SellingCalculatorResult,
} from '@/types/finance';
import { MarketPriceResponse } from './IMarketPriceProvider';
import { calculateSellingDecision } from './financialCalculationEngine';

export const marketPriceService = {
  async getMarketPrices(
    params: MarketPriceQueryParams
  ): Promise<MarketPriceResponse> {
    return agmarknetProvider.fetchMarketPrices(params);
  },

  async getCommodities(): Promise<string[]> {
    return agmarknetProvider.getCommodities();
  },

  async getStatesAndDistricts(): Promise<Record<string, string[]>> {
    return agmarknetProvider.getStatesAndDistricts();
  },

  calculateSellingComparison(
    inputs: SellingCalculatorInputs
  ): SellingCalculatorResult {
    return calculateSellingDecision(inputs);
  },

  compareMandiRates(
    prices: MandiMarketPrice[]
  ): {
    highest: MandiMarketPrice | null;
    lowest: MandiMarketPrice | null;
    averageModal: number;
    spread: number;
  } {
    if (!prices || prices.length === 0) {
      return { highest: null, lowest: null, averageModal: 0, spread: 0 };
    }

    let highest = prices[0];
    let lowest = prices[0];
    let sumModal = 0;

    for (const p of prices) {
      if (p.modal_price > highest.modal_price) highest = p;
      if (p.modal_price < lowest.modal_price) lowest = p;
      sumModal += p.modal_price;
    }

    const averageModal = Math.round(sumModal / prices.length);
    const spread = highest.modal_price - lowest.modal_price;

    return { highest, lowest, averageModal, spread };
  },
};

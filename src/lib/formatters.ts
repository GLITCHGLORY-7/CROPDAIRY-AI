import { AreaUnit } from '@/types/database';

// Standard conversion factors to Acres
const CONVERSION_TO_ACRES: Record<AreaUnit, number> = {
  Acres: 1.0,
  Hectares: 2.47105,
  Bigha: 0.6198, // Standard northern/central benchmark (approx 0.62 acres)
  Guntha: 0.025,  // 40 Guntha = 1 Acre
};

/**
 * Converts a given land area value to standard Acres
 */
export function convertToAcres(value: number, unit: AreaUnit): number {
  if (!value || isNaN(value)) return 0;
  return value * (CONVERSION_TO_ACRES[unit] || 1.0);
}

/**
 * Converts standard Acres to a target unit
 */
export function convertFromAcres(acres: number, targetUnit: AreaUnit): number {
  if (!acres || isNaN(acres)) return 0;
  const factor = CONVERSION_TO_ACRES[targetUnit] || 1.0;
  return acres / factor;
}

/**
 * Format land area with clean decimal precision
 */
export function formatArea(value: number, unit: AreaUnit): string {
  const num = Number(value);
  if (isNaN(num)) return `0 ${unit}`;
  // Format with up to 2 decimal places, omitting trailing zeros
  const formatted = Number.isInteger(num)
    ? num.toString()
    : num.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  return `${formatted} ${unit}`;
}

/**
 * Formats standard date strings into readable locale format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats monetary amounts in Indian Rupees (INR) with Indian numbering (Lakhs, Crores)
 */
export function formatCurrency(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
}


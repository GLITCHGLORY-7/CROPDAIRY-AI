import { describe, it, expect } from 'vitest';
import { convertToAcres, convertFromAcres, formatArea, formatCurrency } from '../lib/formatters';

describe('Land Area Unit Formatter & Math', () => {
  it('converts Acres to Acres accurately (1:1)', () => {
    expect(convertToAcres(5, 'Acres')).toBe(5);
  });

  it('converts Hectares to Acres correctly (~2.471)', () => {
    const acres = convertToAcres(2, 'Hectares');
    expect(acres).toBeCloseTo(4.942, 2);
  });

  it('converts Bigha to Acres correctly (~0.62)', () => {
    const acres = convertToAcres(10, 'Bigha');
    expect(acres).toBeCloseTo(6.198, 2);
  });

  it('converts Guntha to Acres correctly (40 Guntha = 1 Acre)', () => {
    const acres = convertToAcres(40, 'Guntha');
    expect(acres).toBe(1.0);
  });

  it('converts standard Acres back to target units', () => {
    const guntha = convertFromAcres(1.0, 'Guntha');
    expect(guntha).toBeCloseTo(40, 1);

    const hectares = convertFromAcres(2.47105, 'Hectares');
    expect(hectares).toBeCloseTo(1.0, 2);
  });

  it('formats area with unit suffix', () => {
    expect(formatArea(3.5, 'Acres')).toBe('3.5 Acres');
    expect(formatArea(10, 'Guntha')).toBe('10 Guntha');
    expect(formatArea(NaN, 'Hectares')).toBe('0 Hectares');
  });

  it('formats currency in INR with standard Indian grouping', () => {
    expect(formatCurrency(150000)).toBe('₹1,50,000');
    expect(formatCurrency(4500.5, true)).toBe('₹4,500.50');
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(NaN)).toBe('₹0');
  });
});

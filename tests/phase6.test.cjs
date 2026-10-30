// Zero-dependency Node.js test runner for CropDiary AI Phase 6: Farm Finance & Market Prices
const assert = require('assert');

console.log('--- CropDiary AI Phase 6 Automated Test Suite ---');

// Test 1: Minor Unit Arithmetic (Paise) to Prevent Floating-Point Drift
function toPaise(inr) {
  if (isNaN(inr)) return 0;
  return Math.round(inr * 100);
}

function toINR(paise) {
  if (isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

// In standard IEEE 754 JS: 0.1 + 0.2 = 0.30000000000000004
const p1 = toPaise(0.1);
const p2 = toPaise(0.2);
assert.strictEqual(p1 + p2, 30, 'Paise sum must be exactly 30');
assert.strictEqual(toINR(p1 + p2), 0.3, 'Converted INR must be exact 0.30');

const complexAmount = 145920.85;
assert.strictEqual(toPaise(complexAmount), 14592085, 'Exact paise conversion');
assert.strictEqual(toINR(14592085), complexAmount, 'Exact reverse INR conversion');
console.log('✓ Test 1 Passed: Minor unit currency arithmetic (paise) verified (zero float drift)');

// Test 2: Agricultural Unit Conversions to KG Equivalent
function convertToKg(quantity, unit) {
  const q = Number(quantity);
  if (isNaN(q) || q <= 0) return 0;
  const u = (unit || '').toLowerCase().trim();

  if (u.includes('quintal')) return q * 100;
  if (u.includes('tonne') || u.includes('ton')) return q * 1000;
  if (u.includes('bag') || u.includes('sack')) return q * 50;
  if (u.includes('crate') || u.includes('box')) return q * 25;
  if (u.includes('kg') || u.includes('kilogram')) return q;
  return q;
}

assert.strictEqual(convertToKg(25, 'quintals'), 2500, '25 quintals = 2500 kg');
assert.strictEqual(convertToKg(4.5, 'tonnes'), 4500, '4.5 tonnes = 4500 kg');
assert.strictEqual(convertToKg(12, 'bags'), 600, '12 bags = 600 kg');
assert.strictEqual(convertToKg(350, 'kg'), 350, '350 kg = 350 kg');
console.log('✓ Test 2 Passed: Agricultural unit conversions (quintal, tonne, bag, kg) verified');

// Test 3: Harvest-to-Sale Revenue Calculation with Unit Basis Normalization
function calculateGrossSaleRevenue(quantitySold, quantityUnit, unitPrice, priceUnit) {
  if (quantitySold <= 0 || unitPrice <= 0) return 0;
  const pu = (priceUnit || '').toLowerCase().trim();
  const qu = (quantityUnit || '').toLowerCase().trim();

  if (pu.includes('quintal')) {
    if (qu.includes('quintal')) return toINR(toPaise(quantitySold * unitPrice));
    if (qu.includes('kg')) return toINR(toPaise((quantitySold / 100) * unitPrice));
    if (qu.includes('tonne')) return toINR(toPaise(quantitySold * 10 * unitPrice));
  }

  if (pu.includes('kg')) {
    if (qu.includes('kg')) return toINR(toPaise(quantitySold * unitPrice));
    if (qu.includes('quintal')) return toINR(toPaise(quantitySold * 100 * unitPrice));
  }

  return toINR(toPaise(quantitySold * unitPrice));
}

assert.strictEqual(calculateGrossSaleRevenue(15, 'quintals', 2300, 'per_quintal'), 34500);
assert.strictEqual(calculateGrossSaleRevenue(1500, 'kg', 2300, 'per_quintal'), 34500);
assert.strictEqual(calculateGrossSaleRevenue(500, 'kg', 28, 'per_kg'), 14000);
assert.strictEqual(calculateGrossSaleRevenue(5, 'quintals', 28, 'per_kg'), 14000);
console.log('✓ Test 3 Passed: Gross sales revenue calculation across unit bases verified');

// Test 4: Harvest Stock Reconciliation & Unsold Inventory
function reconcileHarvest(harvest, sales) {
  const harvestKg = convertToKg(harvest.quantity, harvest.unit);
  const retainedKg = convertToKg(harvest.household || 0, harvest.unit);
  const availableKg = Math.max(0, harvestKg - retainedKg);

  let totalSoldKg = 0;
  let grossRev = 0;
  let sellingCosts = 0;

  for (const s of sales) {
    totalSoldKg += convertToKg(s.quantity, s.unit);
    grossRev += s.gross;
    sellingCosts += (s.sellingCost || 0);
  }

  const remainingKg = Math.max(0, availableKg - totalSoldKg);
  return {
    harvestKg,
    availableKg,
    totalSoldKg,
    remainingKg,
    remainingQuintals: Number((remainingKg / 100).toFixed(2)),
    netProceeds: grossRev - sellingCosts,
    isOverSold: totalSoldKg > availableKg + 0.05
  };
}

const mockHarvest = { quantity: 40, unit: 'quintals', household: 5 }; // 4000 kg harvest, 500 kg household -> 3500 kg available
const mockSales = [
  { quantity: 15, unit: 'quintals', gross: 34500, sellingCost: 1200 },
  { quantity: 12, unit: 'quintals', gross: 28800, sellingCost: 950 }
];

const bal = reconcileHarvest(mockHarvest, mockSales);
assert.strictEqual(bal.totalSoldKg, 2700, 'Total sold = 27 quintals = 2700 kg');
assert.strictEqual(bal.remainingKg, 800, 'Remaining = 3500 - 2700 = 800 kg');
assert.strictEqual(bal.remainingQuintals, 8.0, 'Remaining = 8 quintals');
assert.strictEqual(bal.netProceeds, (34500 + 28800) - (1200 + 950), 'Net proceeds calculation');
assert.strictEqual(bal.isOverSold, false);
console.log('✓ Test 4 Passed: Harvest stock balance & unsold inventory reconciliation verified');

// Test 5: Budget Utilization & Zero-Budget Division by Zero Safety
function calculateBudget(planned, spent, threshold = 80) {
  const pPaise = toPaise(planned);
  const sPaise = toPaise(spent);
  const remaining = toINR(pPaise - sPaise);

  let percentUsed = 0;
  if (planned > 0) {
    percentUsed = Number(((spent / planned) * 100).toFixed(1));
  }

  let status = 'under_budget';
  if (percentUsed > 100) status = 'over_budget';
  else if (percentUsed >= threshold) status = 'warning';

  return { remaining, percentUsed, status };
}

const activeBudget = calculateBudget(60000, 51000, 80);
assert.strictEqual(activeBudget.percentUsed, 85.0);
assert.strictEqual(activeBudget.status, 'warning');
assert.strictEqual(activeBudget.remaining, 9000);

const overBudget = calculateBudget(40000, 44500, 80);
assert.strictEqual(overBudget.status, 'over_budget');
assert.strictEqual(overBudget.remaining, -4500);

const zeroBudget = calculateBudget(0, 0);
assert.strictEqual(zeroBudget.percentUsed, 0);
assert.strictEqual(zeroBudget.status, 'under_budget');
assert(Number.isFinite(zeroBudget.percentUsed), 'Must not produce NaN or Infinity');
console.log('✓ Test 5 Passed: Budget utilization & zero-budget division safety verified');

// Test 6: Area-Based Overhead Allocation Engine
function allocateAreaCost(overheadAmount, plotAcres, totalFarmAcres) {
  if (totalFarmAcres <= 0 || plotAcres <= 0) return 0;
  const share = Math.min(1, plotAcres / totalFarmAcres);
  return toINR(Math.round(toPaise(overheadAmount) * share));
}

assert.strictEqual(allocateAreaCost(12000, 3.0, 12.0), 3000, '3/12 acres = 25% of 12,000 = 3,000');
assert.strictEqual(allocateAreaCost(8500, 0, 10.0), 0, 'Zero plot area must allocate 0');
console.log('✓ Test 6 Passed: Area-weighted overhead allocation formula verified');

// Test 7: Selling Decision Calculator (Mandi vs Farmgate Arbitrage)
function evaluateSellingDecision({ quantityQtl, mandiRate, distanceKm, freightPerKm, handling, cessPct, localOfferRate }) {
  const grossMandi = quantityQtl * mandiRate;
  const freight = distanceKm * freightPerKm;
  const cess = (grossMandi * cessPct) / 100;
  const totalSellingCost = freight + handling + cess;
  const netMandi = grossMandi - totalSellingCost;
  const localTraderTotal = quantityQtl * localOfferRate;
  const difference = netMandi - localTraderTotal;

  return {
    grossMandi,
    totalSellingCost,
    netMandi,
    localTraderTotal,
    difference,
    recommendation: difference > 0 ? 'mandi' : 'farmgate'
  };
}

const decision1 = evaluateSellingDecision({
  quantityQtl: 25,
  mandiRate: 2350,
  distanceKm: 25,
  freightPerKm: 24, // 600
  handling: 500,
  cessPct: 1.5, // 25 * 2350 = 58750 -> 1.5% = 881.25
  localOfferRate: 2150 // 25 * 2150 = 53750
});
assert.strictEqual(decision1.recommendation, 'mandi', 'Higher net mandi proceeds should recommend mandi');

const decision2 = evaluateSellingDecision({
  quantityQtl: 5,
  mandiRate: 2200,
  distanceKm: 90,
  freightPerKm: 30, // 2700 freight!
  handling: 400,
  cessPct: 2.0,
  localOfferRate: 2100 // 5 * 2100 = 10500
});
assert.strictEqual(decision2.recommendation, 'farmgate', 'High freight on small volume should recommend local farmgate');
console.log('✓ Test 7 Passed: Selling decision economic arbitrage (mandi vs farmgate) verified');

// Test 8: Deduplication and Traceability of Phase 5 Diary Expenses
class MockFinanceStore {
  constructor() {
    this.transactions = [];
  }

  syncDiaryExpense(diaryEntry) {
    if (!diaryEntry.expense) return false;
    const exists = this.transactions.some(t => t.source_diary_entry_id === diaryEntry.id);
    if (exists) return false;

    this.transactions.push({
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      source_diary_entry_id: diaryEntry.id,
      amount: diaryEntry.expense.amount,
      category: diaryEntry.expense.category,
      type: 'expense'
    });
    return true;
  }
}

const store = new MockFinanceStore();
const diaryExpenseEntry = {
  id: 'diary-entry-101',
  title: 'Organic Neem Cake application',
  expense: { amount: 3200, category: 'fertilizer' }
};

assert.strictEqual(store.syncDiaryExpense(diaryExpenseEntry), true, 'First sync must succeed');
assert.strictEqual(store.transactions.length, 1);
assert.strictEqual(store.syncDiaryExpense(diaryExpenseEntry), false, 'Second sync must be idempotent (0 duplicate)');
assert.strictEqual(store.transactions.length, 1, 'Transaction count must remain 1');
console.log('✓ Test 8 Passed: Idempotent synchronization of Phase 5 diary expenses (zero duplicate records) verified');

console.log('\nAll CropDiary AI Phase 6 tests completed successfully (8/8 passed).');

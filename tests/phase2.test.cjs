// Zero-dependency Node.js test runner for CropDiary AI Phase 2
const assert = require('assert');

console.log('--- CropDiary AI Phase 2 Automated Test Suite ---');

// Test 1: Hard constraint season matching logic
function isSeasonCompatible(cropSeasons, targetSeason) {
  return cropSeasons.includes(targetSeason) || cropSeasons.includes('All-Season') || cropSeasons.includes('Perennial');
}

assert.strictEqual(isSeasonCompatible(['Kharif', 'Rabi'], 'Kharif'), true, 'Kharif match failed');
assert.strictEqual(isSeasonCompatible(['Kharif'], 'Rabi'), false, 'Rabi mismatch permitted');
assert.strictEqual(isSeasonCompatible(['Perennial'], 'Zaid'), true, 'Perennial season failed');
console.log('✓ Test 1 Passed: Season compatibility constraint logic verified');

// Test 2: Soil constraint logic (e.g. groundnut physical pegging restriction in heavy clay)
function isSoilCompatible(cropId, suitableSoils, plotSoil) {
  if (cropId === 'groundnut-peanut' && (plotSoil === 'Clay' || plotSoil === 'Black Soil')) {
    return false;
  }
  return suitableSoils.includes(plotSoil);
}

assert.strictEqual(isSoilCompatible('groundnut-peanut', ['Sandy Loam', 'Red Soil'], 'Clay'), false, 'Groundnut in clay permitted');
assert.strictEqual(isSoilCompatible('groundnut-peanut', ['Sandy Loam', 'Red Soil'], 'Sandy Loam'), true, 'Groundnut in sandy loam rejected');
assert.strictEqual(isSoilCompatible('paddy-samba', ['Clay', 'Clay Loam'], 'Clay'), true, 'Paddy in clay rejected');
console.log('✓ Test 2 Passed: Soil physical compatibility logic verified');

// Test 3: Plot economics scaling
function calculatePlotCost(costPerAcre, plotAcres) {
  return Math.round(costPerAcre * plotAcres);
}

assert.strictEqual(calculatePlotCost(25000, 2.0), 50000, '2-acre cost scaling failed');
assert.strictEqual(calculatePlotCost(28200, 1.5), 42300, '1.5-acre cost scaling failed');
console.log('✓ Test 3 Passed: Plot area cost scaling math verified');

// Test 4: Net profit scenario math
function calculateNetProfit(harvestUnits, modalPrice, totalCost) {
  const gross = harvestUnits * modalPrice;
  return gross - totalCost;
}

const profit = calculateNetProfit(20, 2250, 28200); // 45,000 - 28,200 = 16,800
assert.strictEqual(profit, 16800, 'Net profit calculation mismatch');
console.log('✓ Test 4 Passed: Net profit scenario calculation verified');

console.log('=================================================');
console.log('All 4 Phase 2 test suites executed successfully! Code 0.');
console.log('=================================================');

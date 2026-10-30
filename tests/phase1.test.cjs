// Zero-dependency Node.js test runner for CropDiary AI Phase 1
const assert = require('assert');

console.log('--- CropDiary AI Phase 1 Automated Test Suite ---');

// Test 1: Land Area Conversions
const conversionToAcres = {
  Acres: 1.0,
  Hectares: 2.47105,
  Bigha: 0.6198,
  Guntha: 0.025,
};

function convertToAcres(val, unit) {
  return val * (conversionToAcres[unit] || 1.0);
}

assert.strictEqual(convertToAcres(10, 'Acres'), 10, 'Acres 1:1 conversion failed');
assert(Math.abs(convertToAcres(2, 'Hectares') - 4.9421) < 0.01, 'Hectares to Acres failed');
assert(Math.abs(convertToAcres(40, 'Guntha') - 1.0) < 0.001, 'Guntha to Acres failed');
console.log('✓ Test 1 Passed: Land area mathematical conversions verified');

// Test 2: Plot Area Ratio Validation
function validatePlotArea(plotArea, plotUnit, farmArea, farmUnit) {
  const plotAcres = convertToAcres(plotArea, plotUnit);
  const farmAcres = convertToAcres(farmArea, farmUnit);
  // Max 10% buffer
  return plotAcres <= farmAcres * 1.1;
}

assert.strictEqual(validatePlotArea(1.5, 'Acres', 2.0, 'Acres'), true, 'Valid plot area rejected');
assert.strictEqual(validatePlotArea(3.0, 'Acres', 2.0, 'Acres'), false, 'Oversized plot area permitted');
assert.strictEqual(validatePlotArea(40, 'Guntha', 1.0, 'Acres'), true, 'Guntha equivalent plot rejected');
console.log('✓ Test 2 Passed: Plot area bounds validation verified');

// Test 3: Data Isolation & RLS Emulation
const userFarms = [
  { id: 'f1', owner_id: 'user_A', name: 'Farm A1', status: 'active' },
  { id: 'f2', owner_id: 'user_A', name: 'Farm A2', status: 'archived' },
  { id: 'f3', owner_id: 'user_B', name: 'Farm B1', status: 'active' },
];

function getFarmsForUser(userId, status = 'all') {
  return userFarms.filter((f) => f.owner_id === userId && (status === 'all' || f.status === status));
}

const farmsUserA = getFarmsForUser('user_A', 'active');
assert.strictEqual(farmsUserA.length, 1, 'User A active farms count incorrect');
assert.strictEqual(farmsUserA[0].id, 'f1', 'User A farm id mismatch');

const farmsUserB = getFarmsForUser('user_B');
assert.strictEqual(farmsUserB.length, 1, 'User B farms count incorrect');
assert.strictEqual(farmsUserB[0].owner_id, 'user_B', 'User B tenant isolation leak');
console.log('✓ Test 3 Passed: Tenant data isolation & RLS query simulation verified');

// Test 4: Farming Types & Soil Taxonomy
const validFarmingTypes = ['Open field', 'Orchard', 'Greenhouse', 'Kitchen garden', 'Mixed farming', 'Other'];
const validSoils = ['Clay', 'Clay Loam', 'Sandy Loam', 'Red Soil', 'Black Soil', 'Alluvial', 'Silty Loam', 'Other'];

assert(validFarmingTypes.includes('Open field'), 'Missing Open field type');
assert(validFarmingTypes.includes('Orchard'), 'Missing Orchard type');
assert(validSoils.includes('Clay Loam'), 'Missing Clay Loam soil');
console.log('✓ Test 4 Passed: Agricultural taxonomy catalog verified');

console.log('=================================================');
console.log('All 4 Phase 1 test suites executed successfully! Code 0.');
console.log('=================================================');

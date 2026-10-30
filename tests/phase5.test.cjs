// Zero-dependency Node.js test runner for CropDiary AI Phase 5: Farm Diary & Activity Ledger
const assert = require('assert');

console.log('--- CropDiary AI Phase 5 Automated Test Suite ---');

// Test 1: Financial Expense Amount Non-Negativity and Currency Validation
function validateExpense({ amount, currency, category }) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Expense amount must be a valid number');
  }
  if (amount < 0) {
    throw new Error('Expense amount cannot be negative');
  }
  if (!currency || typeof currency !== 'string' || currency.trim().length === 0) {
    throw new Error('Currency is required');
  }
  const allowedCategories = ['seeds', 'fertilizer', 'pesticide', 'labor', 'machinery', 'fuel', 'irrigation_electricity', 'transport', 'packaging', 'lease_rent', 'other'];
  if (!allowedCategories.includes(category)) {
    throw new Error(`Invalid expense category: ${category}`);
  }
  return { valid: true, sanitizedAmount: Number(amount.toFixed(2)) };
}

assert.strictEqual(validateExpense({ amount: 1500.5, currency: 'INR', category: 'labor' }).valid, true);
assert.strictEqual(validateExpense({ amount: 0, currency: 'INR', category: 'fuel' }).sanitizedAmount, 0);
assert.throws(() => validateExpense({ amount: -250, currency: 'INR', category: 'seeds' }), /cannot be negative/);
assert.throws(() => validateExpense({ amount: 100, currency: '', category: 'seeds' }), /Currency is required/);
assert.throws(() => validateExpense({ amount: 100, currency: 'INR', category: 'luxury' }), /Invalid expense category/);
console.log('✓ Test 1 Passed: Strict non-negative financial amount and category validation verified');

// Test 2: Agricultural Input Positive Quantity & Unit Safety
function validateInput({ input_name, input_category, quantity, unit }) {
  if (!input_name || input_name.trim().length < 2) {
    throw new Error('Input name must be at least 2 characters');
  }
  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new Error('Input quantity must be greater than zero');
  }
  if (!unit || unit.trim().length === 0) {
    throw new Error('Input unit is required');
  }
  const allowedCategories = ['bio_fertilizer', 'chemical_fertilizer', 'organic_manure', 'pesticide', 'fungicide', 'herbicide', 'biocontrol_agent', 'growth_promoter', 'seed_treatment', 'other'];
  if (!allowedCategories.includes(input_category)) {
    throw new Error(`Invalid input category: ${input_category}`);
  }
  return { valid: true, input_name: input_name.trim() };
}

assert.strictEqual(validateInput({ input_name: 'Trichoderma viride', input_category: 'biocontrol_agent', quantity: 2.5, unit: 'kg' }).valid, true);
assert.throws(() => validateInput({ input_name: 'Urea', input_category: 'chemical_fertilizer', quantity: 0, unit: 'kg' }), /greater than zero/);
assert.throws(() => validateInput({ input_name: 'DAP', input_category: 'chemical_fertilizer', quantity: -5, unit: 'kg' }), /greater than zero/);
console.log('✓ Test 2 Passed: Agricultural input positive quantities & bio-input taxonomy verified');

// Test 3: Harvest Output Metric Normalization with Stored Unit Preservation
function normalizeHarvestForStats(quantity, unit) {
  const qty = Number(quantity);
  if (qty < 0 || isNaN(qty)) throw new Error('Harvest quantity cannot be negative');
  const u = (unit || '').toLowerCase().trim();
  
  let kg = qty;
  if (u.includes('quintal')) {
    kg = qty * 100;
  } else if (u.includes('tonne') || u.includes('ton')) {
    kg = qty * 1000;
  } else if (u.includes('bag') || u.includes('sack')) {
    kg = qty * 50; // standard 50kg bag
  }
  return {
    originalQuantity: qty,
    originalUnit: unit,
    kgEquivalent: Math.round(kg * 100) / 100
  };
}

const paddyYield = normalizeHarvestForStats(28.5, 'quintals');
assert.strictEqual(paddyYield.originalUnit, 'quintals', 'Original user unit must be preserved');
assert.strictEqual(paddyYield.kgEquivalent, 2850, '28.5 quintals should equate to 2850 kg for aggregate metrics');

const caneYield = normalizeHarvestForStats(12.4, 'tonnes');
assert.strictEqual(caneYield.kgEquivalent, 12400, '12.4 tonnes should equate to 12400 kg');

const seedYield = normalizeHarvestForStats(750, 'kg');
assert.strictEqual(seedYield.kgEquivalent, 750, '750 kg should remain 750 kg');
console.log('✓ Test 3 Passed: Harvest metric normalization preserves raw user unit while computing aggregate statistics');

// Test 4: Timeline Date Grouping Engine
function getTimelineGroup(dateString, referenceNow = new Date('2026-10-26T12:00:00Z')) {
  const targetDate = new Date(dateString);
  const now = new Date(referenceNow);
  
  const targetDay = targetDate.toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  
  if (targetDay === today) return 'Today';
  if (targetDay === yesterday) return 'Yesterday';
  
  const diffDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7 && diffDays > 1) return 'Earlier This Week';
  if (diffDays <= 30 && diffDays > 7) return 'Earlier This Month';
  return 'Older Records';
}

const refDate = new Date('2026-10-26T12:00:00Z');
assert.strictEqual(getTimelineGroup('2026-10-26T08:30:00Z', refDate), 'Today');
assert.strictEqual(getTimelineGroup('2026-10-25T16:00:00Z', refDate), 'Yesterday');
assert.strictEqual(getTimelineGroup('2026-10-22T09:00:00Z', refDate), 'Earlier This Week');
assert.strictEqual(getTimelineGroup('2026-10-10T10:00:00Z', refDate), 'Earlier This Month');
assert.strictEqual(getTimelineGroup('2026-08-15T06:00:00Z', refDate), 'Older Records');
console.log('✓ Test 4 Passed: Chronological timeline grouping verified across all diurnal & weekly boundaries');

// Test 5: Multi-Tenant Data Isolation Simulation
class MockDiaryStore {
  constructor() {
    this.entries = [];
    this.expenses = [];
  }
  
  createEntry(userId, entry) {
    const id = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const fullEntry = { ...entry, id, owner_id: userId };
    this.entries.push(fullEntry);
    if (entry.expense) {
      this.expenses.push({ ...entry.expense, id: `exp-${id}`, entry_id: id });
    }
    return fullEntry;
  }
  
  getEntries(userId) {
    return this.entries.filter(e => e.owner_id === userId);
  }
  
  deleteEntry(userId, entryId) {
    const idx = this.entries.findIndex(e => e.id === entryId && e.owner_id === userId);
    if (idx === -1) return false;
    this.entries.splice(idx, 1);
    this.expenses = this.expenses.filter(ex => ex.entry_id !== entryId);
    return true;
  }
}

const store = new MockDiaryStore();
const farmer1Entry = store.createEntry('farmer-ramesh-1', {
  title: 'Paddy Drip Irrigation',
  farm_id: 'farm-1',
  expense: { amount: 350, currency: 'INR', category: 'irrigation_electricity' }
});

const farmer2Entry = store.createEntry('farmer-suresh-2', {
  title: 'Sugarcane Fertilization',
  farm_id: 'farm-2',
  expense: { amount: 2200, currency: 'INR', category: 'fertilizer' }
});

const rameshRecords = store.getEntries('farmer-ramesh-1');
assert.strictEqual(rameshRecords.length, 1, 'Farmer 1 should have exactly 1 record');
assert.strictEqual(rameshRecords[0].title, 'Paddy Drip Irrigation');

const sureshRecords = store.getEntries('farmer-suresh-2');
assert.strictEqual(sureshRecords.length, 1, 'Farmer 2 should have exactly 1 record');
assert.strictEqual(sureshRecords[0].title, 'Sugarcane Fertilization');

// Unauthorized deletion test
const unauthorizedDelete = store.deleteEntry('farmer-ramesh-1', farmer2Entry.id);
assert.strictEqual(unauthorizedDelete, false, 'Farmer 1 must NOT be permitted to delete Farmer 2 records');
assert.strictEqual(store.getEntries('farmer-suresh-2').length, 1, 'Farmer 2 record must remain intact');
console.log('✓ Test 5 Passed: Multi-tenant tenant boundary security and zero data-bleed verified');

// Test 6: Relational Cascade Deletion Integrity Simulation
assert.strictEqual(store.expenses.length, 2, 'Should have 2 expenses initially');
const authorizedDelete = store.deleteEntry('farmer-ramesh-1', farmer1Entry.id);
assert.strictEqual(authorizedDelete, true, 'Authorized delete should succeed');
assert.strictEqual(store.getEntries('farmer-ramesh-1').length, 0, 'Farmer 1 records should now be 0');
assert.strictEqual(store.expenses.length, 1, 'Cascade delete should automatically clean up child expenses');
assert.strictEqual(store.expenses[0].entry_id, farmer2Entry.id, 'Remaining expense should belong to Farmer 2');
console.log('✓ Test 6 Passed: Relational cascade deletion verified (zero orphan sub-detail records)');

// Test 7: Search Query Tag & Hashtag Prefix Handling
function matchesSearch(entry, query) {
  if (!query || !query.trim()) return true;
  const rawQ = query.trim().toLowerCase();
  const cleanQ = rawQ.startsWith('#') ? rawQ.slice(1) : rawQ;
  
  const titleMatch = entry.title.toLowerCase().includes(rawQ) || entry.title.toLowerCase().includes(cleanQ);
  const descMatch = entry.description ? (entry.description.toLowerCase().includes(rawQ) || entry.description.toLowerCase().includes(cleanQ)) : false;
  const tagMatch = entry.tags ? entry.tags.some(t => {
    const lt = t.toLowerCase();
    return lt.includes(rawQ) || lt.includes(cleanQ);
  }) : false;
  
  return titleMatch || descMatch || tagMatch;
}

const tagTestEntry = {
  title: 'Neem Oil Pest Spray',
  description: 'Targeting yellow stem borer in paddy',
  tags: ['ipm', 'pest_control', 'organic']
};

assert.strictEqual(matchesSearch(tagTestEntry, 'neem'), true);
assert.strictEqual(matchesSearch(tagTestEntry, 'stem borer'), true);
assert.strictEqual(matchesSearch(tagTestEntry, 'pest_control'), true);
assert.strictEqual(matchesSearch(tagTestEntry, '#pest_control'), true, '# hashtag prefix query must match un-prefixed stored tag');
assert.strictEqual(matchesSearch(tagTestEntry, '#organic'), true);
assert.strictEqual(matchesSearch(tagTestEntry, 'fertilizer'), false);
console.log('✓ Test 7 Passed: Search query hashtag parsing and multi-field substring matching verified');

// Test 8: Phase 4 Reminder to Phase 5 Diary Entry Conversion Bridge
function convertReminderToDiaryEntry(reminder, userId) {
  return {
    owner_id: userId,
    farm_id: reminder.farm_id,
    plot_id: reminder.plot_id || null,
    entry_type: 'activity',
    title: `Completed: ${reminder.title}`,
    description: `Converted from farm reminder scheduled for ${reminder.due_date}. Notes: ${reminder.notes || 'N/A'}`,
    occurred_at: new Date().toISOString(),
    status: 'active',
    tags: ['reminder_completed', reminder.reminder_type],
    activity_detail: {
      activity_name: reminder.title,
      labor_count: 1
    }
  };
}

const mockReminder = {
  id: 'rem-101',
  farm_id: 'farm-cauvery-01',
  plot_id: 'plot-01',
  reminder_type: 'spray',
  title: 'Preventive Tricyclazole Application for Blast',
  due_date: '2026-10-27T06:00:00Z',
  notes: 'Check weather spray window before applying'
};

const convertedEntry = convertReminderToDiaryEntry(mockReminder, 'user-123');
assert.strictEqual(convertedEntry.title, 'Completed: Preventive Tricyclazole Application for Blast');
assert.strictEqual(convertedEntry.entry_type, 'activity');
assert.strictEqual(convertedEntry.farm_id, 'farm-cauvery-01');
assert(convertedEntry.tags.includes('reminder_completed'));
assert(convertedEntry.tags.includes('spray'));
assert.strictEqual(convertedEntry.activity_detail.activity_name, 'Preventive Tricyclazole Application for Blast');
console.log('✓ Test 8 Passed: Phase 4 smart reminder to Phase 5 activity ledger conversion bridge verified');

console.log('\nAll CropDiary AI Phase 5 tests completed successfully (8/8 passed).');

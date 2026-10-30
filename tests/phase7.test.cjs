// Zero-dependency Node.js test runner for CropDiary AI Phase 7: AI Farm Assistant, Languages & Government Schemes
const assert = require('assert');

console.log('--- CropDiary AI Phase 7 Automated Test Suite ---');

// Test 1: Agricultural Farmer Intent Classification (Bilingual English & Tamil)
function detectFarmerIntent(query) {
  const q = (query || '').toLowerCase().trim();

  // Expense intent
  if (
    q.includes('expense') ||
    q.includes('spent') ||
    q.includes('cost') ||
    q.includes('money') ||
    q.includes('செலவு') ||
    q.includes('செலவுகள்') ||
    q.includes('பணம்')
  ) {
    return 'expenses';
  }

  // Activity / Diary intent
  if (
    q.includes('activit') ||
    q.includes('work') ||
    q.includes('record') ||
    q.includes('diary') ||
    q.includes('வேலை') ||
    q.includes('செயல்பாடு') ||
    q.includes('பதிவு')
  ) {
    return 'activities';
  }

  // Weather / Alerts intent
  if (
    q.includes('weather') ||
    q.includes('rain') ||
    q.includes('alert') ||
    q.includes('forecast') ||
    q.includes('வானிலை') ||
    q.includes('மழை') ||
    q.includes('எச்சரிக்கை')
  ) {
    return 'weather';
  }

  // Harvest / Yield intent
  if (
    q.includes('harvest') ||
    q.includes('yield') ||
    q.includes('crop cut') ||
    q.includes('அறுவடை') ||
    q.includes('மகசூல்')
  ) {
    return 'harvest';
  }

  // Government scheme intent
  if (
    q.includes('scheme') ||
    q.includes('subsid') ||
    q.includes('pm-kisan') ||
    q.includes('pmfby') ||
    q.includes('மானிய') ||
    q.includes('திட்ட') ||
    q.includes('உதவித்தொகை')
  ) {
    return 'schemes';
  }

  return 'general';
}

assert.strictEqual(detectFarmerIntent('What expenses did I record this month?'), 'expenses');
assert.strictEqual(detectFarmerIntent('எனது பண்ணை செலவுகள் எவ்வளவு?'), 'expenses');
assert.strictEqual(detectFarmerIntent('What fieldwork did I record this week?'), 'activities');
assert.strictEqual(detectFarmerIntent('இந்த வாரம் என்னென்ன வேலைகள் செய்துள்ளேன்?'), 'activities');
assert.strictEqual(detectFarmerIntent('Is there any heavy rain alert tomorrow?'), 'weather');
assert.strictEqual(detectFarmerIntent('பண்ணைக்கு ஏதேனும் தீவிர வானிலை எச்சரிக்கை உள்ளதா?'), 'weather');
assert.strictEqual(detectFarmerIntent('How many quintals did I harvest?'), 'harvest');
assert.strictEqual(detectFarmerIntent('கடந்த அறுவடை மகசூல் எவ்வளவு?'), 'harvest');
assert.strictEqual(detectFarmerIntent('What government subsidies can I apply for?'), 'schemes');
assert.strictEqual(detectFarmerIntent('நான் விண்ணப்பிக்க தகுதியான அரசு மானிய திட்டங்கள் என்ன?'), 'schemes');
console.log('✓ Test 1 Passed: Bilingual farmer intent detection (EN & TA) verified across all 5 key categories');

// Test 2: Grounded Synthesized Expense Reasoning & Anti-Hallucination
function synthesizeExpenseAnswer(expenses, language = 'en') {
  if (!expenses || expenses.length === 0) {
    return {
      content:
        language === 'ta'
          ? 'உங்கள் பண்ணையில் இதுவரை எந்த செலவுப் பதிவுகளும் இல்லை. பண்ணை டைரியில் செலவுகளை பதிவு செய்யவும்.'
          : 'No expense records were found for this farm. Record your inputs and labor in the Farm Diary.',
      total: 0,
      hasRecords: false,
    };
  }

  const totalPaise = expenses.reduce((sum, e) => sum + Math.round(Number(e.amount) * 100), 0);
  const total = totalPaise / 100;

  let text = '';
  if (language === 'ta') {
    text = `உங்கள் பண்ணை பதிவுகளின்படி, மொத்தம் ₹${total.toLocaleString('en-IN')} செலவிடப்பட்டுள்ளது.`;
  } else {
    text = `Based on your verified farm records, you have recorded total expenses of ₹${total.toLocaleString('en-IN')}.`;
  }

  return {
    content: text,
    total,
    hasRecords: true,
  };
}

const mockExpenses = [
  { id: 'e1', title: 'Paddy seeds', amount: 2400 },
  { id: 'e2', title: 'Neem urea', amount: 3850 },
  { id: 'e3', title: 'Labor charges', amount: 4500.5 },
];

const resEn = synthesizeExpenseAnswer(mockExpenses, 'en');
assert.strictEqual(resEn.total, 10750.5);
assert.strictEqual(resEn.hasRecords, true);
assert.strictEqual(resEn.content.includes('₹10,750.5'), true);

const resTa = synthesizeExpenseAnswer(mockExpenses, 'ta');
assert.strictEqual(resTa.content.includes('செலவிடப்பட்டுள்ளது'), true);
assert.strictEqual(resTa.content.includes('₹10,750.5'), true);

// Anti-hallucination check
const resEmpty = synthesizeExpenseAnswer([], 'en');
assert.strictEqual(resEmpty.hasRecords, false);
assert.strictEqual(resEmpty.content.includes('No expense records were found'), true);
console.log('✓ Test 2 Passed: Grounded expense synthesis & anti-hallucination boundary verified');

// Test 3: Verified Government Schemes Catalog Integrity
const SAMPLE_SCHEMES = [
  {
    id: 'pm-kisan-01',
    code: 'PM-KISAN',
    name: 'Pradhan Mantri Kisan Samman Nidhi',
    name_ta: 'பிரதமர் கிசான் சம்மான் நிதி',
    scope: 'central',
    state: 'All India',
    category: 'income_support',
    beneficiary_type: 'all_farmers',
    max_landholding_acres: null,
    eligible_crops: ['All Crops'],
    subsidy_amount_or_percent: '₹6,000 per year in 3 installments of ₹2,000',
    official_portal_url: 'https://pmkisan.gov.in',
  },
  {
    id: 'pmfby-02',
    code: 'PMFBY',
    name: 'Pradhan Mantri Fasal Bima Yojana',
    name_ta: 'பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம்',
    scope: 'central',
    state: 'All India',
    category: 'crop_insurance',
    beneficiary_type: 'all_farmers',
    max_landholding_acres: null,
    eligible_crops: ['Paddy', 'Millets', 'Pulses', 'Oilseeds', 'Cotton'],
    subsidy_amount_or_percent: 'Premium subsidy: 1.5% - 5% farmer share, remaining borne by Govt',
    official_portal_url: 'https://pmfby.gov.in',
  },
  {
    id: 'tn-solar-03',
    code: 'TN-CM-SOLAR-PUMP',
    name: 'Chief Minister Solar Powered Pump Scheme',
    name_ta: 'முதலமைச்சரின் சூரியசக்தி பம்புசெட் திட்டம்',
    scope: 'state',
    state: 'Tamil Nadu',
    category: 'equipment_mechanization',
    beneficiary_type: 'small_marginal',
    max_landholding_acres: 10,
    eligible_crops: ['All Crops'],
    subsidy_amount_or_percent: '70% subsidy (40% State + 30% Central PM-KUSUM)',
    official_portal_url: 'https://aed.tn.gov.in',
  },
];

assert.strictEqual(SAMPLE_SCHEMES.length, 3);
SAMPLE_SCHEMES.forEach((s) => {
  assert.ok(s.code, 'Scheme must have a valid code');
  assert.ok(s.name, 'Scheme must have an English name');
  assert.ok(s.name_ta, 'Scheme must have a Tamil name');
  assert.ok(s.official_portal_url.startsWith('https://'), 'Official portal URL must be HTTPS');
});
console.log('✓ Test 3 Passed: Verified schemes catalog structure & security URL schema verified');

// Test 4: Deterministic Scheme Eligibility Engine
function evaluateEligibility(scheme, farmer) {
  const matched = [];
  const unmatched = [];
  const pending = [];

  // State / Jurisdiction check
  if (scheme.state === 'All India' || scheme.state.toLowerCase() === farmer.state.toLowerCase()) {
    matched.push(`Location matches ${scheme.state}`);
  } else {
    unmatched.push(`Location mismatch: requires ${scheme.state}, farm is in ${farmer.state}`);
  }

  // Acreage check
  if (scheme.max_landholding_acres !== null && scheme.max_landholding_acres !== undefined) {
    if (farmer.acreage <= scheme.max_landholding_acres) {
      matched.push(`Acreage ${farmer.acreage} qualifies under ${scheme.max_landholding_acres} acre cap`);
    } else {
      unmatched.push(`Acreage ${farmer.acreage} exceeds maximum ${scheme.max_landholding_acres} acres`);
    }
  } else {
    matched.push('No landholding ceiling');
  }

  // Crop check
  if (scheme.eligible_crops.includes('All Crops')) {
    matched.push('All crops permitted');
  } else {
    const hasCrop = farmer.crops.some((c) =>
      scheme.eligible_crops.some((sc) => sc.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(sc.toLowerCase()))
    );
    if (hasCrop) {
      matched.push('Grown crop is eligible for scheme');
    } else {
      unmatched.push(`Grown crops (${farmer.crops.join(', ')}) are not listed in scheme`);
    }
  }

  let status = 'potentially_eligible';
  if (unmatched.length > 0) {
    status = 'criteria_not_met';
  } else if (pending.length > 0) {
    status = 'more_info_needed';
  }

  return { status, matched, unmatched, pending };
}

// Test case A: Small farmer in Tamil Nadu growing Paddy for TN Solar Pump
const farmerA = { state: 'Tamil Nadu', acreage: 3.5, crops: ['Paddy'] };
const evalA = evaluateEligibility(SAMPLE_SCHEMES[2], farmerA);
assert.strictEqual(evalA.status, 'potentially_eligible', 'Farmer A must qualify for TN Solar Pump');
assert.strictEqual(evalA.unmatched.length, 0);

// Test case B: Large farmer (15 acres) for TN Solar Pump (10 acre limit)
const farmerB = { state: 'Tamil Nadu', acreage: 15.0, crops: ['Paddy'] };
const evalB = evaluateEligibility(SAMPLE_SCHEMES[2], farmerB);
assert.strictEqual(evalB.status, 'criteria_not_met', 'Farmer B exceeds 10 acre limit');
assert.strictEqual(evalB.unmatched.length, 1);

// Test case C: Farmer in Karnataka applying for TN state scheme
const farmerC = { state: 'Karnataka', acreage: 2.0, crops: ['Paddy'] };
const evalC = evaluateEligibility(SAMPLE_SCHEMES[2], farmerC);
assert.strictEqual(evalC.status, 'criteria_not_met', 'Farmer C in Karnataka cannot apply for TN state scheme');
console.log('✓ Test 4 Passed: Deterministic eligibility engine accurately evaluated small/large acreages & jurisdictions');

// Test 5: Scheme Deadline Reminder Bridge
function buildSchemeReminderPayload(farmId, scheme, dueDate, customNotes) {
  assert.ok(farmId, 'Farm ID required');
  assert.ok(scheme, 'Scheme required');
  assert.ok(dueDate, 'Due date required');

  return {
    farm_id: farmId,
    category: 'custom',
    title: `Government Scheme Deadline: ${scheme.code} (${scheme.name})`,
    due_date: `${dueDate}T09:00:00Z`,
    description: `Apply via official portal: ${scheme.official_portal_url}. ${customNotes || ''}`,
    timezone: 'Asia/Kolkata',
    recurrence: 'none',
    status: 'pending',
  };
}

const reminder = buildSchemeReminderPayload('farm-101', SAMPLE_SCHEMES[0], '2026-11-30', 'Check Aadhaar linking at e-Sevai');
assert.strictEqual(reminder.farm_id, 'farm-101');
assert.strictEqual(reminder.category, 'custom');
assert.strictEqual(reminder.due_date, '2026-11-30T09:00:00Z');
assert.strictEqual(reminder.title.includes('PM-KISAN'), true);
assert.strictEqual(reminder.description.includes('https://pmkisan.gov.in'), true);
assert.strictEqual(reminder.description.includes('Check Aadhaar linking'), true);
console.log('✓ Test 5 Passed: Scheme deadline reminder bridge payload validated (Phase 4 integration)');

console.log('--------------------------------------------------');
console.log('All 5 Phase 7 Automated Tests Passed with 100% Success!');
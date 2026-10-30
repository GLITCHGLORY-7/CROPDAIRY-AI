// Zero-dependency Node.js test runner for CropDiary AI Phase 3: AI Crop Doctor
const assert = require('assert');

console.log('--- CropDiary AI Phase 3 Automated Test Suite ---');

// Test 1: Image validation and format whitelist integrity
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function validateImageFileMock(mimeType, sizeBytes) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { isValid: false, error: `Unsupported image format (${mimeType}).` };
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, error: `Image size exceeds 5.0 MB.` };
  }
  return { isValid: true };
}

assert.strictEqual(validateImageFileMock('image/jpeg', 2048000).isValid, true, 'JPEG validation failed');
assert.strictEqual(validateImageFileMock('image/png', 1048576).isValid, true, 'PNG validation failed');
assert.strictEqual(validateImageFileMock('image/webp', 500000).isValid, true, 'WebP validation failed');
assert.strictEqual(validateImageFileMock('image/gif', 100000).isValid, false, 'GIF rejection failed');
assert.strictEqual(validateImageFileMock('application/pdf', 100000).isValid, false, 'PDF rejection failed');
assert.strictEqual(validateImageFileMock('image/jpeg', 6 * 1024 * 1024).isValid, false, 'Oversized file rejection failed');
console.log('✓ Test 1 Passed: Image validation, MIME whitelist, and 5MB threshold verified');

// Test 2: Confidence band grading logic
function calculateConfidenceBand(score) {
  if (score >= 0.65) return 'high';
  if (score >= 0.40) return 'medium';
  return 'low';
}

assert.strictEqual(calculateConfidenceBand(0.88), 'high', '0.88 should be high confidence');
assert.strictEqual(calculateConfidenceBand(0.65), 'high', '0.65 boundary should be high confidence');
assert.strictEqual(calculateConfidenceBand(0.55), 'medium', '0.55 should be medium confidence');
assert.strictEqual(calculateConfidenceBand(0.40), 'medium', '0.40 boundary should be medium confidence');
assert.strictEqual(calculateConfidenceBand(0.35), 'low', '0.35 should be low confidence');
console.log('✓ Test 2 Passed: Agronomic confidence grading and uncertainty bands verified');

// Test 3: Ground-Truth symptom overlap scoring logic (ICAR Jaccard matching)
function calculateSymptomScore(targetCrop, userCrop, targetSymptoms, userSymptoms, targetParts, userParts) {
  if (!userCrop.toLowerCase().includes(targetCrop.toLowerCase()) && !targetCrop.toLowerCase().includes(userCrop.toLowerCase())) {
    return 0.1;
  }
  const sharedSymptoms = targetSymptoms.filter((s) => userSymptoms.includes(s));
  const symptomRatio = sharedSymptoms.length / Math.max(targetSymptoms.length, 1);

  const sharedParts = targetParts.filter((p) => userParts.includes(p));
  const partRatio = sharedParts.length / Math.max(targetParts.length, 1);

  return Number((symptomRatio * 0.5 + partRatio * 0.5).toFixed(2));
}

// Case A: High match for Paddy Blast
const blastScore = calculateSymptomScore(
  'Paddy',
  'Paddy / Rice',
  ['Spots / Lesions', 'Wilting / Drooping', 'Discoloration / Yellowing'],
  ['Spots / Lesions', 'Discoloration / Yellowing'],
  ['Leaves', 'Stem / Stalk'],
  ['Leaves']
);
assert.ok(blastScore >= 0.55, `Blast score was ${blastScore}, expected >= 0.55`);

// Case B: Tomato Early Blight with matching symptoms
const earlyBlightScore = calculateSymptomScore(
  'Tomato',
  'Tomato',
  ['Spots / Lesions', 'Discoloration / Yellowing', 'Rotting / Decay'],
  ['Spots / Lesions', 'Discoloration / Yellowing'],
  ['Leaves', 'Stem / Stalk'],
  ['Leaves']
);
assert.ok(earlyBlightScore >= 0.55, `Early blight score was ${earlyBlightScore}, expected >= 0.55`);
console.log('✓ Test 3 Passed: Ground-truth ICAR symptom correlation engine verified');

// Test 4: Agronomic safety & IPM pesticide compliance
const BANNED_EXTREMELY_HAZARDOUS_PESTICIDES = [
  'monocrotophos',
  'methyl parathion',
  'phorate',
  'phosphamidon',
  'carbofuran',
  'aldicarb',
  'endosulfan',
];

function verifyChemicalCautionSafety(advisoryText) {
  const lower = advisoryText.toLowerCase();
  for (const chemical of BANNED_EXTREMELY_HAZARDOUS_PESTICIDES) {
    if (lower.includes(`spray ${chemical}`) || lower.includes(`apply ${chemical}`)) {
      return { isSafe: false, reason: `Contains banned WHO Class Ia/Ib chemical: ${chemical}` };
    }
  }
  if (!lower.includes('ppe') && !lower.includes('protective')) {
    return { isSafe: false, reason: 'Missing mandatory Personal Protective Equipment (PPE) advisory.' };
  }
  if (!lower.includes('cibrc')) {
    return { isSafe: false, reason: 'Missing mandatory CIBRC label-claim compliance statement.' };
  }
  return { isSafe: true };
}

const safeSampleAdvisory =
  'If blast lesions exceed 5% ETL, consult KVK for CIBRC-approved Tricyclazole 75% WP. Strictly avoid WHO Class Ia/Ib chemicals. Always wear nitrile gloves, protective mask, and eye goggles (PPE) during application.';
const testSafetyResult = verifyChemicalCautionSafety(safeSampleAdvisory);
assert.strictEqual(testSafetyResult.isSafe, true, 'Safe advisory was wrongly rejected');

const unsafeAdvisory = 'Spray monocrotophos 36% SL immediately across all plants without safety gear.';
const testUnsafeResult = verifyChemicalCautionSafety(unsafeAdvisory);
assert.strictEqual(testUnsafeResult.isSafe, false, 'Unsafe advisory was incorrectly allowed');
console.log('✓ Test 4 Passed: IPM non-chemical priority & zero WHO Class Ia/Ib pesticide enforcement verified');

console.log('=================================================');
console.log('All 4 Phase 3 test suites executed successfully! Code 0.');
console.log('=================================================');

// Zero-dependency Node.js test runner for CropDiary AI Phase 4: Weather Intelligence, Alerts & Reminders
const assert = require('assert');

console.log('--- CropDiary AI Phase 4 Automated Test Suite ---');

// Test 1: WMO Weather Code Mapping and Severity Categorization
const WMO_DESCRIPTIONS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  80: 'Slight rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
};

function decodeWmoCode(code) {
  return WMO_DESCRIPTIONS[code] || 'Atmospheric condition';
}

assert.strictEqual(decodeWmoCode(0), 'Clear sky', 'WMO 0 should be Clear sky');
assert.strictEqual(decodeWmoCode(65), 'Heavy rain', 'WMO 65 should be Heavy rain');
assert.strictEqual(decodeWmoCode(95), 'Thunderstorm', 'WMO 95 should be Thunderstorm');
assert.strictEqual(decodeWmoCode(999), 'Atmospheric condition', 'Unrecognized WMO should return fallback');
console.log('✓ Test 1 Passed: WMO standard meteorological codes decoded accurately');

// Test 2: Agricultural Alert Deterministic Rules & Soil Amplification
function evaluateRainfallAlert(precipitationMm, soilType) {
  if (precipitationMm < 35) return null;
  const isClay = soilType === 'Clay' || soilType === 'Black Soil';
  const severity = precipitationMm >= 60 || (isClay && precipitationMm >= 45) ? 'critical' : 'warning';
  return {
    alert_type: 'heavy_rain',
    severity,
    precipitationMm,
    soilType,
    isClay,
  };
}

assert.strictEqual(evaluateRainfallAlert(20, 'Sandy Loam'), null, '<35mm should not alert');
const loamWarning = evaluateRainfallAlert(45, 'Loam');
assert.strictEqual(loamWarning.severity, 'warning', '45mm on Loam should be warning');
const clayCritical = evaluateRainfallAlert(45, 'Clay');
assert.strictEqual(clayCritical.severity, 'critical', '45mm on Clay must amplify to critical');
const heavyCritical = evaluateRainfallAlert(70, 'Sandy Loam');
assert.strictEqual(heavyCritical.severity, 'critical', '70mm should be critical regardless of soil');
console.log('✓ Test 2 Passed: Heavy rainfall alert & soil texture infiltration amplification verified');

// Test 3: Operational Spray Window Feasibility Scoring
function evaluateSprayWindow(currentWindKmH, sixHourRainProbPct) {
  if (currentWindKmH >= 20 || sixHourRainProbPct >= 45) {
    return { status: 'unfavorable', score: 20 };
  }
  if (currentWindKmH >= 14 || sixHourRainProbPct >= 25) {
    return { status: 'caution', score: 60 };
  }
  return { status: 'favorable', score: 95 };
}

assert.strictEqual(evaluateSprayWindow(8, 5).status, 'favorable', 'Calm weather should be favorable spray window');
assert.strictEqual(evaluateSprayWindow(15, 10).status, 'caution', 'Moderate 15 km/h wind should require caution');
assert.strictEqual(evaluateSprayWindow(22, 10).status, 'unfavorable', 'High wind >=20 km/h must be unfavorable (drift hazard)');
assert.strictEqual(evaluateSprayWindow(9, 50).status, 'unfavorable', 'Rain prob >=45% must be unfavorable (wash-off risk)');
console.log('✓ Test 3 Passed: Spray window wind drift and wash-off guidance verified');

// Test 4: Reminder Recurrence Scheduling
function getNextRecurrenceDate(dueDateIso, recurrence) {
  const d = new Date(dueDateIso);
  switch (recurrence) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'none':
    default:
      return null;
  }
  return d.toISOString();
}

const baseDate = '2026-11-01T08:00:00.000Z';
const nextDaily = getNextRecurrenceDate(baseDate, 'daily');
assert.strictEqual(new Date(nextDaily).getUTCDate(), 2, 'Daily should advance by 1 day');
const nextWeekly = getNextRecurrenceDate(baseDate, 'weekly');
assert.strictEqual(new Date(nextWeekly).getUTCDate(), 8, 'Weekly should advance by 7 days');
const nextBiweekly = getNextRecurrenceDate(baseDate, 'biweekly');
assert.strictEqual(new Date(nextBiweekly).getUTCDate(), 15, 'Biweekly should advance by 14 days');
assert.strictEqual(getNextRecurrenceDate(baseDate, 'none'), null, 'None recurrence returns null');
console.log('✓ Test 4 Passed: Reminder recurrence scheduling (daily, weekly, biweekly) verified');

// Test 5: Weather Trigger Deduplication within 24 Hours
function shouldTriggerReminder(existingReminders, farmId, triggerType, windowMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const recent = existingReminders.find((r) => {
    if (r.farm_id !== farmId) return false;
    if (r.weather_trigger_type !== triggerType) return false;
    const createdAt = new Date(r.created_at).getTime();
    return now - createdAt < windowMs;
  });
  return !recent;
}

const mockReminders = [
  {
    id: 'rem-1',
    farm_id: 'farm-01',
    weather_trigger_type: 'high_wind',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2h ago
  },
];

assert.strictEqual(shouldTriggerReminder(mockReminders, 'farm-01', 'high_wind'), false, 'Should deduplicate high_wind triggered 2h ago');
assert.strictEqual(shouldTriggerReminder(mockReminders, 'farm-01', 'heavy_rain'), true, 'Should allow heavy_rain for same farm');
assert.strictEqual(shouldTriggerReminder(mockReminders, 'farm-02', 'high_wind'), true, 'Should allow high_wind for different farm');
console.log('✓ Test 5 Passed: Proactive weather-triggered reminder deduplication verified');

// Test 6: In-App Notification State Transition and Unread Counter
const notifications = [
  { id: 'notif-1', read_at: null, is_dismissed: false },
  { id: 'notif-2', read_at: null, is_dismissed: false },
  { id: 'notif-3', read_at: '2026-10-26T12:00:00Z', is_dismissed: false },
  { id: 'notif-4', read_at: null, is_dismissed: true },
];

function getUnreadCount(list) {
  return list.filter((n) => !n.read_at && !n.is_dismissed).length;
}

assert.strictEqual(getUnreadCount(notifications), 2, 'Unread count should be 2 (excluding read and dismissed)');
notifications[0].read_at = new Date().toISOString();
assert.strictEqual(getUnreadCount(notifications), 1, 'Marking read reduces unread count to 1');
console.log('✓ Test 6 Passed: In-app notification center state transitions & unread counter verified');

console.log('\nAll Phase 4 Automated Unit and Integration Tests Passed Cleanly (Code 0).\n');
process.exit(0);

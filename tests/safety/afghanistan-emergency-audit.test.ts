import { describe, test, expect } from 'bun:test';
import {
  getEmergencyNumbers,
  EMERGENCY_NUMBERS_AF,
  EMERGENCY_NUMBERS_PK,
  type EmergencyContact,
} from '../../src/data/lexicon';
import { runPipeline } from '../../src/server/pipeline/run';

describe('Afghanistan Emergency Telephone Numbers & Primary Source Verification (P2)', () => {
  test('1. Afghanistan 112 is strictly classified as Fire Department, NOT an ambulance', () => {
    const entry112 = EMERGENCY_NUMBERS_AF.find((n) => n.number === '112');
    expect(entry112).toBeDefined();
    expect(entry112!.label).toContain('Fire Department');
    expect(entry112!.label.toLowerCase()).not.toContain('ambulance');
    expect(entry112!.source).toContain('State Department');
  });

  test('2. Kabul Ambulance is 102 with coverage strictly annotated as Kabul City only', () => {
    const entry102 = EMERGENCY_NUMBERS_AF.find((n) => n.number === '102');
    expect(entry102).toBeDefined();
    expect(entry102!.label).toBe('Kabul Ambulance Service');
    expect(entry102!.coverage).toBe('Kabul City only');
    expect(entry102!.source).toContain('Ministry of Public Health');
  });

  test('3. Afghan 166 helpline is independently verified as MoPH health/psycho-social helpline', () => {
    const entry166 = EMERGENCY_NUMBERS_AF.find((n) => n.number === '166');
    expect(entry166).toBeDefined();
    expect(entry166!.label).toContain('Health');
    expect(entry166!.source).toContain('Ministry of Public Health');
  });

  test('4. Afghanistan directory includes 119 Police and 410 Awaaz humanitarian helpline', () => {
    const entry119 = EMERGENCY_NUMBERS_AF.find((n) => n.number === '119');
    expect(entry119).toBeDefined();
    expect(entry119!.label).toContain('Police');

    const entry410 = EMERGENCY_NUMBERS_AF.find((n) => n.number === '410');
    expect(entry410).toBeDefined();
    expect(entry410!.label).toContain('Awaaz');
  });

  test('5. Province-specific coverage: Herat / non-Kabul regions return direct hospital guidance', () => {
    const heratNums = getEmergencyNumbers('AF', 'Herat');
    expect(heratNums.length).toBeGreaterThan(0);

    const provincialDirect = heratNums.find((n) => n.label.includes('Provincial Hospital Emergency'));
    expect(provincialDirect).toBeDefined();
    expect(provincialDirect!.coverage).toContain('Centralized ambulance dispatch unavailable outside Kabul');

    // Reference note indicates Kabul Ambulance is not available in Herat
    const ambulRef = heratNums.find((n) => n.number === '102');
    expect(ambulRef?.label).toContain('Reference Only');
  });

  test('6. Kabul-specific coverage: Kabul region returns 102 as active Kabul Ambulance Service', () => {
    const kabulNums = getEmergencyNumbers('AF', 'Kabul');
    expect(kabulNums).toEqual(EMERGENCY_NUMBERS_AF);
    expect(kabulNums[0]!.number).toBe('102');
    expect(kabulNums[0]!.label).toBe('Kabul Ambulance Service');
  });

  test('7. Unknown location fallback returns national directory with Kabul City coverage caveat', () => {
    const fallbackNums = getEmergencyNumbers('AF');
    expect(fallbackNums).toEqual(EMERGENCY_NUMBERS_AF);
    const amb = fallbackNums.find((n) => n.number === '102');
    expect(amb!.coverage).toBe('Kabul City only');
  });

  test('8. Never substitutes Pakistan emergency numbers for Afghan users in pipeline', async () => {
    const res = await runPipeline({
      message: 'My brother collapsed in Kabul, unconscious and not breathing!',
      language: 'en',
      sessionId: `audit_af_leak_${Date.now()}`,
      country: 'AF',
      persist: false,
    });

    expect(res.emergency).toBeDefined();
    // Must contain Kabul Ambulance 102
    expect(res.content).toContain('102');

    // Must NOT contain Pakistan emergency numbers
    expect(res.content).not.toContain('1122');
    expect(res.content).not.toContain('1023');
    expect(res.content).not.toContain('115');
    expect(res.content).not.toContain('1166');
    expect(res.content).not.toContain('Alkhidmat');
    expect(res.content).not.toContain('Rescue 1122');
  });

  test('9. Native Dari/Urdu script Afghanistan query routes to AF jurisdiction without explicit country code', async () => {
    const res = await runPipeline({
      message: 'افغانستان میں میرے بھائی بے ہوش ہیں اور سانس نہیں آ رہی',
      language: 'ur',
      sessionId: `audit_af_script_${Date.now()}`,
      persist: false,
    });

    expect(res.emergency).toBeDefined();
    // Must NOT leak Pakistan numbers
    expect(res.content).not.toContain('1122');
    expect(res.content).not.toContain('1023');
    expect(res.content).not.toContain('115');
    expect(res.content).not.toContain('الخدمت');
    expect(res.content).not.toContain('ریسکیو');
    // Must contain Kabul Ambulance 102 or MoPH Helpline 166
    expect(res.content).toContain('102');
  });

  test('10. Non-Kabul provincial query (Herat) routes to hospital direct transport without 102 dispatch', async () => {
    const res = await runPipeline({
      message: 'میرے بھائی ہرات میں بے ہوش ہیں اور سانس نہیں لے رہے',
      language: 'ur',
      sessionId: `audit_herat_${Date.now()}`,
      persist: false,
    });

    expect(res.emergency).toBeDefined();
    // Must direct to provincial hospital emergency and helpline 166
    expect(res.content).toContain('ہسپتال');
    expect(res.content).toContain('166');
    // Must NOT contain Pakistan numbers
    expect(res.content).not.toContain('1122');
    expect(res.content).not.toContain('1023');
    expect(res.content).not.toContain('115');
  });
});

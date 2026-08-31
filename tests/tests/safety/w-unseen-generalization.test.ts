// ============================================================
// Category W — Unseen-question generalization regression suite
// Tests that the L0 deterministic engine generalizes to
// colloquial, indirect and misspelled descriptions of
// emergencies that were NOT used during development.
//
// These inputs are natural-language variations a Pakistani user
// might actually type. They must be caught by the DETERMINISTIC
// L0 engine (not the LLM), so they work offline too.
// ============================================================
import { describe, expect, test } from 'bun:test';
import { runL0Triage } from '@/lib/engine/safety-engine';

describe('W. unseen-question generalization — cardiac emergencies', () => {
  const cases = [
    'my chest feels like someone is sitting on it',
    'feels like an elephant on my chest',
    'crushing feeling in my chest',
    'squeezing sensation in chest',
    'tight band around my chest',
    'heavy weight on my chest',
    'chest feels really tight',
    "can't catch my breath",
    'gasping for air',
    'wheezing badly',
    'breathing is really hard',
    'breathless just walking to the bathroom',
  ];
  for (const q of cases) {
    test(`EMERGENCY: "${q}"`, () => {
      const r = runL0Triage(q);
      expect(r.level).toBe('EMERGENCY');
      expect(r.shortCircuited).toBe(true);
    });
  }
});

describe('W. unseen-question generalization — stroke (FAST colloquialisms)', () => {
  const cases = [
    'my face feels weird on one side',
    'my smile looks crooked',
    'words are coming out wrong',
    'my arm feels heavy and weak',
    "cant feel my arm",
    'talking funny all of a sudden',
    'one side of my face feels strange',
    'my smile is uneven',
  ];
  for (const q of cases) {
    test(`EMERGENCY: "${q}"`, () => {
      const r = runL0Triage(q);
      expect(r.level).toBe('EMERGENCY');
      expect(r.matchedCategory).toBe('stroke');
    });
  }
});

describe('W. unseen-question generalization — anaphylaxis / allergic reaction', () => {
  test('lips swelling after medicine → EMERGENCY anaphylaxis', () => {
    const r = runL0Triage('my lips are swelling up after medicine');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('anaphylaxis');
  });
  test('hives all over after eating → EMERGENCY anaphylaxis', () => {
    const r = runL0Triage('breaking out in hives all over after eating');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('anaphylaxis');
  });
  test('throat closing up → EMERGENCY anaphylaxis', () => {
    const r = runL0Triage('throat closing up');
    expect(r.level).toBe('EMERGENCY');
  });
  test('face swelling after a sting → EMERGENCY', () => {
    const r = runL0Triage('my face is swelling up after a bee sting');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('anaphylaxis');
  });
});

describe('W. unseen-question generalization — poisoning / overdose', () => {
  const cases = [
    'child got into medicine cabinet',
    'found child with pills',
    'dont know what they swallowed',
    'found empty pill bottle',
    'may have swallowed something',
    'drank something from a bottle',
  ];
  for (const q of cases) {
    test(`EMERGENCY: "${q}"`, () => {
      const r = runL0Triage(q);
      expect(r.level).toBe('EMERGENCY');
      expect(r.matchedCategory).toBe('poisoning');
    });
  }
});

describe('W. unseen-question generalization — pediatric danger signs', () => {
  const cases = [
    'my baby is floppy and wont respond',
    'child is limp and not moving',
    'my baby is not waking up',
    'baby is floppy',
    'child is limp',
  ];
  for (const q of cases) {
    test(`EMERGENCY: "${q}"`, () => {
      const r = runL0Triage(q);
      expect(r.level).toBe('EMERGENCY');
      // "not waking up" routes to unconscious template; others to pediatric
      expect(['pediatric', 'unconscious']).toContain(r.matchedCategory);
    });
  }
});

describe('W. unseen-question generalization — obstetric emergencies', () => {
  test('pregnant + baby stopped moving → EMERGENCY', () => {
    const r = runL0Triage('I am pregnant and my baby stopped moving');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('obstetric-emergency');
  });
  test('pregnant + cant feel baby → EMERGENCY', () => {
    const r = runL0Triage("pregnant and cant feel baby moving");
    expect(r.level).toBe('EMERGENCY');
  });
  test('pregnant + severe pain in belly → EMERGENCY', () => {
    const r = runL0Triage('pregnant and severe pain in belly');
    expect(r.level).toBe('EMERGENCY');
  });
  test('Roman Urdu: hamal mein bachay ki harkat band → EMERGENCY', () => {
    const r = runL0Triage('mera hamal hai aur bachay ki harkat band ho gayi hai');
    expect(r.level).toBe('EMERGENCY');
  });
});

describe('W. unseen-question generalization — multilingual (Roman Urdu)', () => {
  test('saans nahi aa rahi → EMERGENCY', () => {
    expect(runL0Triage('mujhe saans nahi aa rahi').level).toBe('EMERGENCY');
  });
  test('mera seena dab raha hai → EMERGENCY', () => {
    expect(runL0Triage('mera seena dab raha hai').level).toBe('EMERGENCY');
  });
  test('meri ammi ka aik side kaam nahi kar raha → EMERGENCY stroke', () => {
    const r = runL0Triage('meri ammi ka aik taraf kaam nahi kar raha');
    expect(r.level).toBe('EMERGENCY');
  });
  test('bache ko dast hain — classified appropriately (not ignored)', () => {
    const r = runL0Triage('mere bache ko dast hain');
    expect(r.level).not.toBe('SELF_CARE');
  });
  test('hont sooj rahe hain dawa khane ke baad → EMERGENCY anaphylaxis', () => {
    const r = runL0Triage('mere hont sooj rahe hain dawa khane ke baad');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('anaphylaxis');
  });
});

describe('W. unseen-question generalization — Urdu (Nastaliq script)', () => {
  test('سانس نہیں آ رہی → EMERGENCY', () => {
    expect(runL0Triage('مجھے سانس نہیں آ رہی').level).toBe('EMERGENCY');
  });
  test('سینے میں دباؤ → EMERGENCY', () => {
    expect(runL0Triage('مجھے سینے میں دباؤ ہے').level).toBe('EMERGENCY');
  });
});

describe('W. unseen-question generalization — fail-safe (no false SELF_CARE)', () => {
  // Ambiguous inputs must NEVER default to SELF_CARE — uncertainty
  // must escalate to at least ROUTINE with clarification.
  const ambiguous = [
    'i feel sick',
    'my stomach hurts',
    'what should i take',
    'is this serious',
    'help',
    'what do i do',
    'i dont feel right',
    'something is wrong with me',
  ];
  for (const q of ambiguous) {
    test(`ambiguous "${q}" is NOT SELF_CARE`, () => {
      const r = runL0Triage(q);
      expect(r.level).not.toBe('SELF_CARE');
    });
  }
});

describe('W. unseen-question generalization — non-emergency stays calm', () => {
  // Genuine self-care cases must NOT be over-escalated.
  const mild = [
    'i have a mild headache since yesterday',
    'small cut on my finger',
    'mild sore throat for a day',
    'slightly runny nose',
  ];
  for (const q of mild) {
    test(`mild "${q}" is not over-escalated to EMERGENCY`, () => {
      const r = runL0Triage(q);
      expect(r.level).not.toBe('EMERGENCY');
    });
  }
});

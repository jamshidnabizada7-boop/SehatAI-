import { describe, expect, test } from 'bun:test';
import { runConstellation } from '@/server/constellation';
import { retrieveCorpus, runL0Triage } from '@/lib/engine/safety-engine';

describe('presentation triage regressions', () => {
  for (const message of ['I have a mild headache', 'I am headeach', 'I have a mild headache, no seizures and no loss of consciousness', 'What are the warning signs of a seizure?']) {
    test(`does not declare emergency for ${message}`, async () => {
      const triage = runL0Triage(message);
      expect(triage.level).not.toBe('EMERGENCY');
      const c = await runConstellation({message,language:'en',profile:null,triageLevel:triage.level,response:'',citations:[],allowedCitationIds:new Set()});
      expect(c.results.find(r => r.name === 'red-flag-recheck')?.veto).toBe(false);
    });
  }
  test('keeps affirmed emergencies when a lower triage level is supplied', async () => {
    const c=await runConstellation({message:'I have chest pain and trouble breathing',language:'en',profile:null,triageLevel:'SELF_CARE',response:'',citations:[],allowedCitationIds:new Set()});
    expect(c.mustAbstain).toBe(true);
    expect(c.results.find(r => r.name === 'red-flag-recheck')?.veto).toBe(true);
  });
  test('misspelled headache retrieves headache guidance', () => {
    expect(retrieveCorpus('I am headeach')[0]?.item.id).toBe('headache');
  });
});

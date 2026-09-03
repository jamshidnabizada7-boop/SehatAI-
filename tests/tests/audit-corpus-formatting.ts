import { CORPUS } from '../src/data/corpus';

console.log('Total topics:', CORPUS.length);

const nonStandard = [];

for (const item of CORPUS) {
  const issues = [];
  if (!item.source.verifiedAt?.startsWith('2026')) {
    issues.push(`verifiedAt: ${item.source.verifiedAt}`);
  }
  if (!item.content.en.includes('SEE A DOCTOR IF:')) {
    issues.push('EN missing "SEE A DOCTOR IF:"');
  }
  if (!item.content.en.includes('EMERGENCY / GO IMMEDIATELY:')) {
    issues.push('EN missing "EMERGENCY / GO IMMEDIATELY:"');
  }
  if (!item.content.ur.includes('ڈاکٹر کو دکھائیں:')) {
    issues.push('UR missing "ڈاکٹر کو دکھائیں:"');
  }
  if (!item.content.ur.includes('ایمرجنسی (فوراً جائیں):')) {
    issues.push('UR missing "ایمرجنسی (فوراً جائیں):"');
  }
  if (!item.content.roman.includes('DOCTOR KO DIKHAYEIN:')) {
    issues.push('Roman missing "DOCTOR KO DIKHAYEIN:"');
  }
  if (!item.content.roman.includes('EMERGENCY (FORI JAYEIN):')) {
    issues.push('Roman missing "EMERGENCY (FORI JAYEIN):"');
  }

  if (issues.length > 0) {
    nonStandard.push({ id: item.id, issues });
  }
}

console.log(`Found ${nonStandard.length} non-standard topics:`);
for (const ns of nonStandard) {
  console.log(`- ${ns.id}: ${ns.issues.join(', ')}`);
}

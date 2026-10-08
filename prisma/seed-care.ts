// Care Connect seed — jurisdiction policies (§16), commission rules (§7),
// feature-flag rows (§2). Idempotent. Run: npx tsx prisma/seed-care.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Seeding Care Connect defaults...');

  // §16 Jurisdiction policies. Defaults are CONSERVATIVE:
  // messaging/audio/video allowed inside-corridor; prescribing is
  // policy-dependent (OFF by default; enabled only by explicit ops decision
  // with legal review — plan §84). Cross-border corridors require an
  // explicit policy row; absent row = booking BLOCKED.
  const policies = [
    // Pakistan domestic corridor
    {
      countryCode: 'PK', doctorCountry: 'PK',
      consultationAllowed: true, messagingAllowed: true, audioAllowed: true, videoAllowed: true,
      prescribingAllowed: false, controlledDrugAllowed: false, medicalCertificateAllowed: true,
      secondOpinionAllowed: true, minorConsultationAllowed: true,
      requiresGuardian: false, requiresLocalDoctor: false,
      policyVersion: '2026.10-initial',
    },
    // Afghanistan domestic corridor
    {
      countryCode: 'AF', doctorCountry: 'AF',
      consultationAllowed: true, messagingAllowed: true, audioAllowed: true, videoAllowed: true,
      prescribingAllowed: false, controlledDrugAllowed: false, medicalCertificateAllowed: true,
      secondOpinionAllowed: true, minorConsultationAllowed: true,
      requiresGuardian: false, requiresLocalDoctor: false,
      policyVersion: '2026.10-initial',
    },
    // Cross-border: Afghan patient, PK-licensed doctor — second opinions only,
    // no local claims. NOTE: requiresLocalDoctor=true blocks routine booking
    // until a legal review (§84) enables the corridor.
    {
      countryCode: 'AF', doctorCountry: 'PK',
      consultationAllowed: false, messagingAllowed: true, audioAllowed: true, videoAllowed: true,
      prescribingAllowed: false, controlledDrugAllowed: false, medicalCertificateAllowed: false,
      secondOpinionAllowed: true, minorConsultationAllowed: true,
      requiresGuardian: false, requiresLocalDoctor: true,
      policyVersion: '2026.10-initial',
    },
    {
      countryCode: 'PK', doctorCountry: 'AF',
      consultationAllowed: false, messagingAllowed: true, audioAllowed: true, videoAllowed: true,
      prescribingAllowed: false, controlledDrugAllowed: false, medicalCertificateAllowed: false,
      secondOpinionAllowed: true, minorConsultationAllowed: true,
      requiresGuardian: false, requiresLocalDoctor: true,
      policyVersion: '2026.10-initial',
    },
  ];
  for (const p of policies) {
    await db.jurisdictionPolicy.upsert({
      where: { countryCode_doctorCountry_policyVersion: { countryCode: p.countryCode, doctorCountry: p.doctorCountry, policyVersion: p.policyVersion } },
      create: p,
      update: p,
    });
  }
  console.log(`Jurisdiction policies: ${policies.length}`);

  // §7 CommissionRule — default 20% (2000 bps) for all PK consultations.
  // Effective-dated; admin console (Phase 15) manages changes.
  const existing = await db.commissionRule.findFirst({ where: { country: 'PK', enabled: true } });
  if (!existing) {
    await db.commissionRule.create({
      data: {
        country: 'PK', consultationType: null, specialty: null, doctorTier: null,
        percentageBps: 2000, fixedFeeMinor: 0, currency: null,
        effectiveFrom: new Date('2026-10-01T00:00:00Z'), enabled: true,
      },
    });
    console.log('CommissionRule: default PK 20% created');
  } else {
    console.log('CommissionRule: PK default exists');
  }

  // §2 FeatureFlag rows — mirror env defaults so the admin console can
  // toggle at runtime. CARE_PAYMENTS etc. stay OFF until a real provider
  // agreement exists (no fake integrations).
  const flags: Array<{ key: string; enabled: boolean }> = [
    { key: 'CARE_ENABLED', enabled: true },
    { key: 'CARE_PAYMENTS_ENABLED', enabled: false },
    { key: 'CARE_MESSAGING_ENABLED', enabled: true },
    { key: 'CARE_AUDIO_ENABLED', enabled: true },
    { key: 'CARE_VIDEO_ENABLED', enabled: true },
    { key: 'CARE_TRANSLATION_ENABLED', enabled: true },
    { key: 'CARE_PRESCRIPTIONS_ENABLED', enabled: false },
    { key: 'CARE_DOCTOR_PAYOUTS_ENABLED', enabled: false },
    { key: 'CARE_REVIEWS_ENABLED', enabled: true },
    { key: 'CARE_INSTANT_ENABLED', enabled: false },
    { key: 'CARE_FAVORITES_ENABLED', enabled: true },
  ];
  for (const f of flags) {
    await db.featureFlag.upsert({
      where: { key: f.key },
      create: { key: f.key, enabled: f.enabled, scope: 'global' },
      update: {},
    });
  }
  console.log(`Feature flags: ${flags.length}`);

  console.log('Care Connect seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });

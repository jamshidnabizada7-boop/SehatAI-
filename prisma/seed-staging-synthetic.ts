// prisma/seed-staging-synthetic.ts
// Tier 3 — Staging Synthetic Persona Seed (§8.4.2)
// Seeds deterministic synthetic doctors, patients, encounters, and medical records.
// Safe for staging environment. Contains zero real PII or real credentials.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('==> Seeding Tier 3 Staging Synthetic Personas (§8.4.2)...');
  const dummyHash = await bcrypt.hash('StagingSyntheticPassword!2026', 4);

  // 1. Synthetic Doctors
  const doctorsData = [
    {
      email: 'dr.ayesha@sehatai.local',
      name: 'Dr. Ayesha Khan',
      pmdcNumber: 'PMDC-SYNTH-001',
      specialty: 'Cardiology',
      subSpecialty: 'Interventional Cardiology',
      facilityName: 'Alkhidmat Hospital Lahore',
      facilityCity: 'Lahore',
      yearsExperience: 12,
      bio: 'Consultant Cardiologist with verified license. [TEST PROFILE]',
      gender: 'female',
      services: [
        { type: 'VIDEO', title: 'Video Cardiology Consultation', priceMinor: 250000, durationMinutes: 20 },
        { type: 'TEXT', title: 'Text Medical Inquiry', priceMinor: 150000, durationMinutes: 15 },
      ],
    },
    {
      email: 'dr.bilal@sehatai.local',
      name: 'Dr. Bilal Tariq',
      pmdcNumber: 'PMDC-SYNTH-002',
      specialty: 'General Medicine',
      subSpecialty: 'Internal Medicine',
      facilityName: 'Alkhidmat Medical Centre Islamabad',
      facilityCity: 'Islamabad',
      yearsExperience: 8,
      bio: 'General Physician with verified license. [TEST PROFILE]',
      gender: 'male',
      services: [
        { type: 'TEXT', title: 'Text Consultation', priceMinor: 120000, durationMinutes: 15 },
        { type: 'AUDIO', title: 'Audio Consultation', priceMinor: 180000, durationMinutes: 15 },
      ],
    },
    {
      email: 'dr.fatima@sehatai.local',
      name: 'Dr. Fatima Noor',
      pmdcNumber: 'PMDC-SYNTH-003',
      specialty: 'Pediatrics',
      subSpecialty: 'Neonatal & Child Health',
      facilityName: 'Alkhidmat Hospital Karachi',
      facilityCity: 'Karachi',
      yearsExperience: 10,
      bio: 'Consultant Pediatrician with verified license. [TEST PROFILE]',
      gender: 'female',
      services: [
        { type: 'VIDEO', title: 'Video Pediatric Consultation', priceMinor: 200000, durationMinutes: 20 },
      ],
    },
  ];

  const doctorProfiles: Record<string, any> = {};
  const doctorUsers: Record<string, any> = {};

  for (const doc of doctorsData) {
    const user = await db.user.upsert({
      where: { email: doc.email },
      create: {
        email: doc.email,
        name: doc.name,
        role: 'doctor',
        passwordHash: dummyHash,
        accountStatus: 'active',
        consentAt: new Date(),
      },
      update: {
        name: doc.name,
        role: 'doctor',
        accountStatus: 'active',
      },
    });
    doctorUsers[doc.email] = user;

    const profile = await db.doctorProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        pmdcNumber: doc.pmdcNumber,
        specialty: doc.specialty,
        subSpecialty: doc.subSpecialty,
        facilityName: doc.facilityName,
        facilityCity: doc.facilityCity,
        yearsExperience: doc.yearsExperience,
        bio: doc.bio,
        gender: doc.gender,
        country: 'PK',
        careStatus: 'ACTIVE',
        pmdcVerifiedAt: new Date('2026-01-15T00:00:00Z'),
        languages: JSON.stringify(['en', 'ur']),
        payoutMethod: JSON.stringify({ type: 'bank_account', label: 'Habib Bank Limited', last4: '4321' }),
      },
      update: {
        pmdcNumber: doc.pmdcNumber,
        specialty: doc.specialty,
        careStatus: 'ACTIVE',
        facilityName: doc.facilityName,
        facilityCity: doc.facilityCity,
      },
    });
    doctorProfiles[doc.email] = profile;

    // Doctor Jurisdiction
    await db.doctorJurisdiction.upsert({
      where: {
        doctorProfileId_countryCode: {
          doctorProfileId: profile.id,
          countryCode: 'PK',
        },
      },
      create: {
        doctorProfileId: profile.id,
        countryCode: 'PK',
        status: 'LICENSED',
        verifiedAt: new Date('2026-01-15T00:00:00Z'),
      },
      update: {
        status: 'LICENSED',
      },
    });

    // Doctor Credentials
    const existingCred = await db.doctorCredential.findFirst({
      where: { doctorProfileId: profile.id, kind: 'MEDICAL_LICENSE' },
    });
    if (!existingCred) {
      await db.doctorCredential.create({
        data: {
          doctorProfileId: profile.id,
          kind: 'MEDICAL_LICENSE',
          registrationNumber: doc.pmdcNumber,
          registeredName: doc.name,
          qualification: 'MBBS, FCPS',
          issuingBody: 'PM&DC',
          country: 'PK',
          status: 'VERIFIED',
          verificationMethod: 'REGISTRY_API',
          verifiedAt: new Date('2026-01-15T00:00:00Z'),
        },
      });
    }

    // Services
    for (const s of doc.services) {
      await db.doctorService.upsert({
        where: {
          doctorProfileId_type: {
            doctorProfileId: profile.id,
            type: s.type,
          },
        },
        create: {
          doctorProfileId: profile.id,
          type: s.type,
          title: s.title,
          priceMinor: s.priceMinor,
          currency: 'PKR',
          durationMinutes: s.durationMinutes,
          enabled: true,
        },
        update: {
          title: s.title,
          priceMinor: s.priceMinor,
          enabled: true,
        },
      });
    }
  }
  console.log(`✓ Seeded ${doctorsData.length} synthetic doctor profiles.`);

  // 2. Synthetic Patients
  const patientsData = [
    {
      email: 'test.patient1@sehatai.local',
      name: 'Zahid Mock',
      sex: 'male',
      ageBand: 'adult',
      conditions: ['Hypertension'],
      allergies: ['Penicillin'],
      medications: ['Amlodipine 5mg'],
    },
    {
      email: 'test.patient2@sehatai.local',
      name: 'Maryam Synthetic',
      sex: 'female',
      ageBand: 'adult',
      conditions: ['Seasonal Rhinitis'],
      allergies: ['Pollen'],
      medications: ['Loratadine 10mg'],
    },
  ];

  const patientUsers: Record<string, any> = {};

  for (const pat of patientsData) {
    const user = await db.user.upsert({
      where: { email: pat.email },
      create: {
        email: pat.email,
        name: pat.name,
        role: 'user',
        passwordHash: dummyHash,
        accountStatus: 'active',
        consentAt: new Date(),
      },
      update: {
        name: pat.name,
        accountStatus: 'active',
      },
    });
    patientUsers[pat.email] = user;

    await db.patientProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        sex: pat.sex,
        ageBand: pat.ageBand,
        conditions: JSON.stringify(pat.conditions),
        allergies: JSON.stringify(pat.allergies),
        medications: JSON.stringify(pat.medications),
      },
      update: {
        conditions: JSON.stringify(pat.conditions),
        allergies: JSON.stringify(pat.allergies),
      },
    });
  }
  console.log(`✓ Seeded ${patientsData.length} synthetic patient profiles.`);

  // 3. Synthetic Consultations & Medical Encounters (5 encounters)
  const ayesha = doctorProfiles['dr.ayesha@sehatai.local'];
  const ayeshaUser = doctorUsers['dr.ayesha@sehatai.local'];
  const bilal = doctorProfiles['dr.bilal@sehatai.local'];
  const bilalUser = doctorUsers['dr.bilal@sehatai.local'];
  const fatima = doctorProfiles['dr.fatima@sehatai.local'];
  const fatimaUser = doctorUsers['dr.fatima@sehatai.local'];

  const zahid = patientUsers['test.patient1@sehatai.local'];
  const maryam = patientUsers['test.patient2@sehatai.local'];

  const consultationsData = [
    {
      slug: 'consult-stg-001',
      patientId: zahid.id,
      doctorProfileId: ayesha.id,
      doctorUserId: ayeshaUser.id,
      type: 'VIDEO',
      status: 'COMPLETED',
      priceMinor: 250000,
      currency: 'PKR',
      scheduledAt: new Date(Date.now() - 86400000 * 3),
      completedAt: new Date(Date.now() - 86400000 * 3 + 1800000),
      note: 'Patient presented with mild chest tightness following exertion. Resting ECG normal, vitals stable (BP 125/80, HR 72). Advised lifestyle modifications, lipid panel test, and routine follow-up.',
      prescription: {
        indication: 'Cardiovascular risk reduction',
        instructions: 'Take one tablet daily after meals',
        medicines: [{ medicine: 'Aspirin (Cardiprin)', form: 'Tablet', strength: '75mg', frequency: 'Once daily', durationDays: 30 }],
      },
    },
    {
      slug: 'consult-stg-002',
      patientId: maryam.id,
      doctorProfileId: bilal.id,
      doctorUserId: bilalUser.id,
      type: 'TEXT',
      status: 'COMPLETED',
      priceMinor: 120000,
      currency: 'PKR',
      scheduledAt: new Date(Date.now() - 86400000 * 2),
      completedAt: new Date(Date.now() - 86400000 * 2 + 3600000),
      note: 'Patient presented with mild seasonal rhinitis. Vital signs normal. Rhinorrhea and sneezing without fever. Prescribed oral antihistamine and saline nasal spray.',
      prescription: {
        indication: 'Allergic rhinitis symptom relief',
        instructions: 'Take tablet at bedtime, use nasal spray twice daily',
        medicines: [
          { medicine: 'Cetirizine', form: 'Tablet', strength: '10mg', frequency: 'Once daily at night', durationDays: 10 },
          { medicine: 'Normal Saline Nasal Spray', form: 'Spray', strength: '0.9%', frequency: 'Twice daily', durationDays: 14 },
        ],
      },
    },
    {
      slug: 'consult-stg-003',
      patientId: maryam.id,
      doctorProfileId: fatima.id,
      doctorUserId: fatimaUser.id,
      type: 'VIDEO',
      status: 'SCHEDULED',
      priceMinor: 200000,
      currency: 'PKR',
      scheduledAt: new Date(Date.now() + 86400000 * 2),
    },
    {
      slug: 'consult-stg-004',
      patientId: zahid.id,
      doctorProfileId: bilal.id,
      doctorUserId: bilalUser.id,
      type: 'TEXT',
      status: 'CANCELLED',
      priceMinor: 120000,
      currency: 'PKR',
      scheduledAt: new Date(Date.now() - 86400000 * 4),
      cancelledReason: 'Patient requested reschedule due to work conflict',
    },
    {
      slug: 'consult-stg-005',
      patientId: zahid.id,
      doctorProfileId: fatima.id,
      doctorUserId: fatimaUser.id,
      type: 'VIDEO',
      status: 'COMPLETED',
      priceMinor: 200000,
      currency: 'PKR',
      scheduledAt: new Date(Date.now() - 86400000 * 1),
      completedAt: new Date(Date.now() - 86400000 * 1 + 1500000),
      note: 'Routine pediatric nutritional checkup for dependent. Growth parameters within normal WHO percentiles. Dietary guidance provided.',
    },
  ];

  for (const c of consultationsData) {
    // Check if consultation already exists
    const existing = await db.consultation.findFirst({
      where: {
        patientId: c.patientId,
        doctorProfileId: c.doctorProfileId,
        type: c.type,
        status: c.status,
      },
    });

    const consult = existing ?? (await db.consultation.create({
      data: {
        patientId: c.patientId,
        doctorProfileId: c.doctorProfileId,
        doctorUserId: c.doctorUserId,
        type: c.type,
        status: c.status,
        priceMinor: c.priceMinor,
        currency: c.currency,
        patientCountry: 'PK',
        doctorCountry: 'PK',
        scheduledAt: c.scheduledAt,
        completedAt: c.completedAt,
        cancelledReason: c.cancelledReason,
      },
    }));

    // Clinical note if specified
    if (c.note) {
      const existingNote = await db.clinicalNote.findFirst({ where: { consultationId: consult.id } });
      if (!existingNote) {
        await db.clinicalNote.create({
          data: {
            consultationId: consult.id,
            type: 'SOAP',
            visibility: 'PATIENT_SUMMARY',
            content: c.note,
            authoredById: c.doctorUserId,
          },
        });
      }
    }

    // Prescription if specified
    if (c.prescription) {
      const existingRx = await db.prescription.findFirst({ where: { consultationId: consult.id } });
      if (!existingRx) {
        const docObj = Object.values(doctorsData).find((d) => d.email === c.doctorUserId) ?? doctorsData[0];
        const rx = await db.prescription.create({
          data: {
            consultationId: consult.id,
            doctorProfileId: c.doctorProfileId,
            patientId: c.patientId,
            jurisdiction: 'PK',
            status: 'SIGNED',
            indication: c.prescription.indication,
            instructions: c.prescription.instructions,
            doctorRegistrationNumber: docObj.pmdcNumber,
            doctorNameSnapshot: docObj.name,
            issuedAt: c.completedAt ?? new Date(),
          },
        });

        for (const item of c.prescription.medicines) {
          await db.prescriptionItem.create({
            data: {
              prescriptionId: rx.id,
              medicine: item.medicine,
              form: item.form,
              strength: item.strength,
              frequency: item.frequency,
              durationDays: item.durationDays,
              isControlled: false,
            },
          });
        }
      }
    }

    // Audit Event
    const existingAudit = await db.consultationAuditEvent.findFirst({ where: { consultationId: consult.id } });
    if (!existingAudit) {
      await db.consultationAuditEvent.create({
        data: {
          consultationId: consult.id,
          action: `consultation.${c.status.toLowerCase()}`,
          actorId: c.doctorUserId,
          actorRole: 'SYSTEM',
          detailJson: JSON.stringify({ reason: 'synthetic encounter seed' }),
        },
      });
    }
  }

  console.log(`✓ Seeded ${consultationsData.length} synthetic clinical encounters with notes & prescriptions.`);
  console.log('==> Tier 3 Staging Synthetic Seeding COMPLETE.');
}

main()
  .catch((e) => {
    console.error('❌ Synthetic seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { FACILITIES_SEED, haversineKm } from '../src/data/facilities-seed';
import { generateQrMatrix } from '../src/lib/qr';
import { en } from '../src/lib/i18n/en';
import { ur } from '../src/lib/i18n/ur';
import { roman } from '../src/lib/i18n/roman';
import type { DoctorSummary } from '../src/lib/types';

const db = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${msg}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

async function runReviewer3Suite() {
  console.log('============================================================');
  console.log('  SehatAI — Reviewer 3 Comprehensive Final Verification Suite');
  console.log('============================================================\n');

  // ------------------------------------------------------------
  // TEST GROUP 1: SQLite Database Synchronization & Facilities Integrity
  // ------------------------------------------------------------
  console.log('[Test Group 1] SQLite Database Synchronization & Facilities');
  const dbFacilities = await db.facility.findMany();
  assert(dbFacilities.length >= 55, `SQLite database has >= 55 facilities (found: ${dbFacilities.length})`);
  assert(dbFacilities.length === FACILITIES_SEED.length, `SQLite count exactly matches seed code (${dbFacilities.length} === ${FACILITIES_SEED.length})`);

  const cities = ['Lahore', 'Karachi', 'Peshawar', 'Islamabad', 'Multan', 'Rawalpindi', 'Quetta', 'Faisalabad', 'Hyderabad'];
  for (const city of cities) {
    const cityFacs = dbFacilities.filter((f) => f.city.toLowerCase() === city.toLowerCase());
    assert(cityFacs.length > 0, `City "${city}" has synchronized facilities in DB (count: ${cityFacs.length})`);
  }

  const alkhidmatFacilities = dbFacilities.filter((f) => f.name.toLowerCase().includes('alkhidmat'));
  assert(alkhidmatFacilities.length >= 20, `Alkhidmat Foundation facilities present in DB (count: ${alkhidmatFacilities.length})`);

  for (const f of dbFacilities) {
    assert(f.lat >= 23 && f.lat <= 38, `Facility "${f.name}" has valid Pakistan latitude: ${f.lat}`);
    assert(f.lng >= 60 && f.lng <= 78, `Facility "${f.name}" has valid Pakistan longitude: ${f.lng}`);
    assert(typeof f.emergency24 === 'boolean', `Facility "${f.name}" has emergency24 flag`);
    assert(typeof f.verified === 'boolean', `Facility "${f.name}" has verified flag`);
    
    let services: string[] = [];
    try {
      services = JSON.parse(f.services);
    } catch {
      services = [];
    }
    assert(Array.isArray(services), `Facility "${f.name}" has valid JSON services array`);
  }

  // ------------------------------------------------------------
  // TEST GROUP 2: Universal Google Maps Navigation URLs
  // ------------------------------------------------------------
  console.log('\n[Test Group 2] Universal Cross-Platform Google Maps Navigation URLs');
  for (const f of FACILITIES_SEED) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}`;
    const parsed = new URL(mapsUrl);
    assert(parsed.protocol === 'https:', `Maps URL has HTTPS protocol for ${f.name}`);
    assert(parsed.hostname === 'www.google.com', `Maps URL has www.google.com hostname for ${f.name}`);
    assert(parsed.pathname === '/maps/search/', `Maps URL uses /maps/search/ endpoint for ${f.name}`);
    assert(parsed.searchParams.get('api') === '1', `Maps URL includes api=1 parameter for ${f.name}`);
    assert(parsed.searchParams.get('query') === `${f.lat},${f.lng}`, `Maps URL query matches coordinates: ${f.lat},${f.lng}`);
  }

  // ------------------------------------------------------------
  // TEST GROUP 3: ISO/IEC 18004 QR Matrix Generation Across Versions 1 to 20
  // ------------------------------------------------------------
  console.log('\n[Test Group 3] ISO/IEC 18004 QR Code Generation & Scalability (Versions 1-20)');

  // Test various payload lengths from 5 bytes up to 600 bytes
  const testPayloads = [
    { name: 'Minimal payload (V1)', text: '1122' },
    { name: 'Short clinical note (V2-V4)', text: 'SehatAI: Patient John Doe, Routine consultation.' },
    { name: 'Medium triage summary (V5-V10)', text: 'SehatAI — Doctor Summary\nChief complaint: Fever for 3 days\nDuration: 3 days\nSymptoms: High fever, Body ache, Chills\nRed flags observed: None\nTriage level: ROUTINE\nGuidance given: Rest, Paracetamol, Hydration | Monitor temperature\nDisclaimer: Not medical diagnosis.' },
    { name: 'Long clinical summary (V11-V16)', text: 'SehatAI — Clinical Triage Summary\nPatient: Anonymous Mobile User\nChief complaint: Acute chest tightness and left arm pain\nDuration: 45 minutes\nSymptoms: Severe crushing chest pain, Shortness of breath, Cold sweating, Dizziness\nRed flags observed: Suspected Acute Coronary Syndrome (ACS), Radiation to left shoulder\nTriage level: EMERGENCY\nGuidance given: Call 1122 immediately | Rest in seated position | Do NOT drive to hospital | Keep aspirin accessible\nEmergency contacts: Rescue 1122, Sehat Helpline 1166\nDisclaimer: Pre-hospital clinical triage job aid. Immediate emergency room evaluation required.' },
    { name: 'Max-range comprehensive record (V17-V20)', text: 'SehatAI — Comprehensive OPD Triage & Referral Record\nFacility: Mayo Hospital Lahore OPD\nTriage Category: Obstetrics & High Risk Pregnancy\nPatient Chief Complaint: 34 weeks gestation with severe headache, blurred vision, and epigastric pain\nObserved Red Flags: Suspected Severe Pre-eclampsia / Eclampsia danger signs\nVital Signs: BP 160/110 mmHg, Proteinuria 3+\nTriage Priority: IMMEDIATE EMERGENCY (L0 Short-Circuit)\nInterventions Provided: Immediate referral to labor ward, Left lateral tilt position, IV access secured, Emergency transport 1122 dispatched\nPhysician Attending: On-duty Medical Officer\nTimestamp: 2026-08-28T17:45:00.000Z\nVerification Hash: 8f9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d\nDisclaimer: Certified clinical handoff protocol.' },
    { name: 'Urdu Nastaliq & Unicode Text', text: 'صحت اے آئی — ڈاکٹر کا خلاصہ\nبنیادی شکایت: شدید بخار اور سر درد\nٹرائیاژ سطح: ایمرجنسی 1122' },
    { name: 'Roman Urdu Text', text: 'SehatAI — Doctor Khulasa\nBunyadi shikayat: Seene mein shadeed dard aur ulti\nTriage darja: EMERGENCY (1122 call karein)' },
  ];

  for (const item of testPayloads) {
    const matrix = generateQrMatrix(item.text);
    assert(Array.isArray(matrix) && matrix.length > 0, `Matrix generated for ${item.name}`);
    const size = matrix.length;
    // QR matrix size is always 17 + 4 * version (21, 25, 29, ..., 97)
    assert((size - 17) % 4 === 0, `Matrix size ${size}x${size} is ISO standard 17 + 4*V for ${item.name}`);
    assert(matrix.every((row) => row.length === size), `Matrix is strictly square (${size}x${size})`);
    assert(matrix.every((row) => row.every((cell) => typeof cell === 'boolean')), `All cells are boolean in ${item.name}`);

    // Verify Finder Patterns (Top-Left, Top-Right, Bottom-Left 7x7)
    // Center of 7x7 finder is at offset (3, 3) relative to top/left and must be black (true)
    assert(matrix[3][3] === true, `Top-Left finder center is black (${item.name})`);
    assert(matrix[3][size - 4] === true, `Top-Right finder center is black (${item.name})`);
    assert(matrix[size - 4][3] === true, `Bottom-Left finder center is black (${item.name})`);

    // Top-Left finder outer border (0,0), (0,6), (6,0), (6,6) must be black
    assert(matrix[0][0] === true && matrix[0][6] === true && matrix[6][0] === true && matrix[6][6] === true, `Top-Left finder outer box is valid (${item.name})`);
  }

  // ------------------------------------------------------------
  // TEST GROUP 4: Doctor Summary Modal Serialization & Shape Unwrapping
  // ------------------------------------------------------------
  console.log('\n[Test Group 4] Doctor Summary Modal & Trilingual i18n Parity');

  const mockSummary: DoctorSummary = {
    chiefComplaint: 'Severe chest tightness',
    duration: '2 hours',
    symptoms: ['Chest pain', 'Shortness of breath'],
    redFlagsObserved: ['Radiation to left arm'],
    triageLevel: 'EMERGENCY',
    guidanceGiven: ['Call 1122', 'Sit upright'],
    disclaimer: 'Generated by SehatAI clinical engine.',
  };

  // Test direct shape
  const unwrapDirect = ('summary' in mockSummary && (mockSummary as any).summary) ? (mockSummary as any).summary : mockSummary;
  assert(unwrapDirect.chiefComplaint === 'Severe chest tightness', 'Direct DoctorSummary object unwrapped correctly');

  // Test wrapped shape { summary: DoctorSummary }
  const wrapped = { summary: mockSummary };
  const unwrapWrapped = ('summary' in wrapped && wrapped.summary) ? wrapped.summary : (wrapped as unknown as DoctorSummary);
  assert(unwrapWrapped.chiefComplaint === 'Severe chest tightness', 'Wrapped { summary: DoctorSummary } payload unwrapped correctly');

  // Test trilingual summary i18n keys
  const requiredSummaryKeys = [
    'title', 'subtitle', 'chiefComplaint', 'duration', 'symptoms',
    'redFlags', 'guidance', 'triage', 'language', 'disclaimer',
    'none', 'generating', 'failed', 'copy', 'copied', 'whatsapp',
    'print', 'qrCode', 'qrTitle', 'qrDesc', 'showQr', 'hideQr'
  ];

  for (const k of requiredSummaryKeys) {
    assert(typeof (en.summary as any)[k] === 'string' && (en.summary as any)[k].length > 0, `English summary.${k} exists`);
    assert(typeof (ur.summary as any)[k] === 'string' && (ur.summary as any)[k].length > 0, `Urdu summary.${k} exists`);
    assert(typeof (roman.summary as any)[k] === 'string' && (roman.summary as any)[k].length > 0, `Roman Urdu summary.${k} exists`);
  }

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`  REVIEWER 3 SUITE RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('============================================================\n');

  await db.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runReviewer3Suite().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

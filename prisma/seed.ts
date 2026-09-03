import { PrismaClient } from '@prisma/client';
import { CORPUS } from '../src/data/corpus';
import { FACILITIES_SEED } from '../src/data/facilities-seed';

const db = new PrismaClient();

async function main() {
  console.log('Seeding SehatAI database...');

  // Documents (corpus provenance) — idempotent SYNC: upserts every corpus
  // item (so newly added documents appear) and removes stale slugs (so the
  // DB always mirrors src/data/corpus.ts, which the offline pack integrity
  // tests rely on).
  const existingDocs = await db.document.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existingDocs.map((d) => d.slug));
  for (const item of CORPUS) {
    if (existingSlugs.has(item.id)) {
      await db.document.update({
        where: { slug: item.id },
        data: {
          title: item.title.en,
          publisher: item.source.publisher,
          license: item.source.license,
          sourceUrl: item.source.url,
          verifiedAt: item.source.verifiedAt,
          topic: item.topic,
          audience: item.audience,
          baseLevel: item.baseLevel,
        },
      });
    } else {
      await db.document.create({
        data: {
          slug: item.id,
          title: item.title.en,
          publisher: item.source.publisher,
          license: item.source.license,
          sourceUrl: item.source.url,
          language: 'en',
          verifiedAt: item.source.verifiedAt,
          topic: item.topic,
          audience: item.audience,
          baseLevel: item.baseLevel,
        },
      });
    }
  }
  const codeIds = new Set(CORPUS.map((c) => c.id));
  for (const slug of existingSlugs) {
    if (!codeIds.has(slug)) {
      await db.document.delete({ where: { slug } });
    }
  }
  console.log(`Documents synced (${CORPUS.length} in code)`);

  // Facilities — idempotent SYNC: upserts every facility from FACILITIES_SEED
  // (so newly added Alkhidmat Foundation hospitals, labs, and blood banks appear)
  // and removes stale facilities so the SQLite database mirrors src/data/facilities-seed.ts.
  const existingFacilities = await db.facility.findMany();
  const existingByNameCity = new Map(
    existingFacilities.map((f) => [`${f.name.trim().toLowerCase()}::${f.city.trim().toLowerCase()}`, f]),
  );
  const codeKeys = new Set<string>();

  for (const f of FACILITIES_SEED) {
    const key = `${f.name.trim().toLowerCase()}::${f.city.trim().toLowerCase()}`;
    codeKeys.add(key);
    const existing = existingByNameCity.get(key);
    if (existing) {
      await db.facility.update({
        where: { id: existing.id },
        data: {
          name: f.name,
          nameUr: f.nameUr ?? null,
          type: f.type,
          lat: f.lat,
          lng: f.lng,
          city: f.city,
          district: f.district,
          phone: f.phone ?? null,
          services: JSON.stringify(f.services),
          emergency24: f.emergency24h,
          source: f.source,
          verified: f.verified,
        },
      });
    } else {
      await db.facility.create({
        data: {
          id: f.id,
          name: f.name,
          nameUr: f.nameUr ?? null,
          type: f.type,
          lat: f.lat,
          lng: f.lng,
          city: f.city,
          district: f.district,
          phone: f.phone ?? null,
          services: JSON.stringify(f.services),
          emergency24: f.emergency24h,
          source: f.source,
          verified: f.verified,
        },
      });
    }
  }

  for (const [key, existing] of existingByNameCity.entries()) {
    if (!codeKeys.has(key)) {
      await db.facility.delete({ where: { id: existing.id } });
    }
  }
  console.log(`Facilities synced (${FACILITIES_SEED.length} in code)`);

  // Pack version — sync items count with current CORPUS
  const pack = await db.packVersion.findFirst({ where: { version: '1.0.0' } });
  if (!pack) {
    await db.packVersion.create({
      data: {
        version: '1.0.0',
        manifest: JSON.stringify({
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          items: CORPUS.length,
          lexiconPatterns: 16,
          corpusChecksum: 'seed-v1',
        }),
      },
    });
    console.log(`Seeded pack version 1.0.0 (${CORPUS.length} items)`);
  } else {
    await db.packVersion.update({
      where: { id: pack.id },
      data: {
        manifest: JSON.stringify({
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          items: CORPUS.length,
          lexiconPatterns: 16,
          corpusChecksum: 'seed-v1',
        }),
      },
    });
    console.log(`Synced pack version 1.0.0 manifest (${CORPUS.length} items)`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

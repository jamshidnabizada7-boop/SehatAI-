// SehatAI — Medicine Order API
// GET /api/medicine-orders → user's medicine orders
// POST /api/medicine-orders { items, pharmacyName, prescriptionUrl?, deliveryAddress? } → place order
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

const PARTNER_PHARMACIES = [
  { name: 'Dawaai', cities: ['Karachi', 'Lahore', 'Islamabad'], deliveryTime: '2-4 hours' },
  { name: 'InstaCare', cities: ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad'], deliveryTime: '3-6 hours' },
  { name: 'Servaid', cities: ['Lahore', 'Islamabad'], deliveryTime: '1-3 hours' },
];

export async function GET() {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const orders = await db.medicineOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return NextResponse.json({
    orders: orders.map(o => ({ ...o, items: JSON.parse(o.items), createdAt: o.createdAt.toISOString() })),
    partnerPharmacies: PARTNER_PHARMACIES,
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { items?: unknown; pharmacyName?: string; prescriptionUrl?: string; deliveryAddress?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ error: 'At least one medicine item is required' }, { status: 400 });
  if (!body.pharmacyName) return NextResponse.json({ error: 'pharmacyName is required' }, { status: 400 });

  const order = await db.medicineOrder.create({
    data: {
      userId: user.id,
      pharmacyName: body.pharmacyName,
      items: JSON.stringify(items),
      prescriptionUrl: body.prescriptionUrl ?? null,
      deliveryAddress: body.deliveryAddress ?? null,
    },
  });
  await db.auditLog.create({
    data: { userId: user.id, action: 'patient.medicine.ordered', resource: order.id, meta: JSON.stringify({ pharmacyName: body.pharmacyName, itemCount: items.length }) },
  });
  return NextResponse.json({ ok: true, orderId: order.id, status: 'placed' });
}

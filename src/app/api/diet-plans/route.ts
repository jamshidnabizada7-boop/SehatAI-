// SehatAI — Diet Plan API (Pakistani food database)
// GET /api/diet-plans → user's diet plans
// POST /api/diet-plans { condition } → generate AI diet plan with Pakistani foods
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

// Pakistani food database — calorie estimates per serving
const PAKISTANI_FOODS: Record<string, { name: string; calories: number; category: string }[]> = {
  breakfast: [
    { name: 'Paratha (1 piece)', calories: 200, category: 'bread' },
    { name: 'Omelette (2 eggs)', calories: 180, category: 'protein' },
    { name: 'Dahi (yogurt) 1 cup', calories: 150, category: 'dairy' },
    { name: 'Chai (1 cup)', calories: 50, category: 'drink' },
    { name: 'Nihari (1 bowl)', calories: 450, category: 'curry' },
    { name: 'Halwa Puri (1 serving)', calories: 500, category: 'sweet' },
  ],
  lunch: [
    { name: 'Roti (1 piece)', calories: 80, category: 'bread' },
    { name: 'Daal (1 bowl)', calories: 180, category: 'protein' },
    { name: 'Chicken Karahi (1 serving)', calories: 350, category: 'curry' },
    { name: 'Biryani (1 plate)', calories: 500, category: 'rice' },
    { name: 'Sabzi (vegetable curry)', calories: 150, category: 'vegetable' },
    { name: 'Salad (kachumber)', calories: 50, category: 'vegetable' },
  ],
  dinner: [
    { name: 'Roti (1 piece)', calories: 80, category: 'bread' },
    { name: 'Grilled Chicken (100g)', calories: 165, category: 'protein' },
    { name: 'Fish Curry (1 serving)', calories: 250, category: 'curry' },
    { name: 'Vegetable Pulao (1 plate)', calories: 350, category: 'rice' },
    { name: 'Soup (1 bowl)', calories: 100, category: 'other' },
  ],
  snacks: [
    { name: 'Fruit (banana/apple)', calories: 100, category: 'fruit' },
    { name: 'Roasted Chana (30g)', calories: 100, category: 'protein' },
    { name: 'Dry Fruits (mixed 20g)', calories: 120, category: 'other' },
    { name: 'Raita (1 cup)', calories: 100, category: 'dairy' },
  ],
};

// Condition-specific recommendations
const CONDITION_DIETS: Record<string, { name: string; avoid: string[]; prefer: string[]; dailyCalories: number }> = {
  diabetes: {
    name: 'Diabetic Diet',
    avoid: ['Biryani', 'Halwa Puri', 'Nihari', 'Chai (with sugar)'],
    prefer: ['Roti (whole wheat)', 'Daal', 'Sabzi', 'Grilled Chicken', 'Roasted Chana'],
    dailyCalories: 1800,
  },
  hypertension: {
    name: 'Low-Sodium Diet (DASH)',
    avoid: ['Nihari', 'Chicken Karahi', 'Paratha (with salt)'],
    prefer: ['Daal', 'Sabzi', 'Fruit', 'Dahi', 'Salad'],
    dailyCalories: 2000,
  },
  pregnancy: {
    name: 'Pregnancy Diet',
    avoid: ['Raw fish', 'Unpasteurized milk'],
    prefer: ['Omelette', 'Daal', 'Dahi', 'Fruit', 'Roti', 'Vegetable Pulao'],
    dailyCalories: 2200,
  },
  'weight-loss': {
    name: 'Weight Loss Diet',
    avoid: ['Biryani', 'Halwa Puri', 'Nihari', 'Paratha'],
    prefer: ['Daal', 'Sabzi', 'Grilled Chicken', 'Salad', 'Soup', 'Fruit'],
    dailyCalories: 1500,
  },
  general: {
    name: 'Balanced Diet',
    avoid: [],
    prefer: [],
    dailyCalories: 2000,
  },
};

export async function GET() {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const plans = await db.dietPlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  return NextResponse.json({
    plans: plans.map(p => ({ ...p, meals: JSON.parse(p.meals), createdAt: p.createdAt.toISOString() })),
    availableConditions: Object.entries(CONDITION_DIETS).map(([key, val]) => ({ type: key, name: val.name, dailyCalories: val.dailyCalories })),
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { condition?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const condition = body.condition ?? 'general';
  const dietConfig = CONDITION_DIETS[condition] ?? CONDITION_DIETS.general;

  // Generate a meal plan by filtering foods based on condition
  const meals: Record<string, any> = {};
  for (const [mealType, foods] of Object.entries(PAKISTANI_FOODS)) {
    const filtered = foods.filter(f => !dietConfig.avoid.includes(f.name));
    const preferred = filtered.filter(f => dietConfig.prefer.includes(f.name));
    meals[mealType] = (preferred.length > 0 ? preferred : filtered).slice(0, 3);
  }

  const totalCalories = Object.values(meals).flat().reduce((sum, f) => sum + f.calories, 0);

  const plan = await db.dietPlan.create({
    data: {
      userId: user.id,
      condition,
      dailyCalories: dietConfig.dailyCalories,
      meals: JSON.stringify({ ...meals, dietName: dietConfig.name, estimatedCalories: totalCalories }),
      notes: `Avoid: ${dietConfig.avoid.join(', ') || 'none'}. Prefer: ${dietConfig.prefer.join(', ') || 'balanced'}.`,
    },
  });

  return NextResponse.json({
    ok: true,
    planId: plan.id,
    dietName: dietConfig.name,
    dailyCalories: dietConfig.dailyCalories,
    meals,
    estimatedCalories: totalCalories,
    avoid: dietConfig.avoid,
    prefer: dietConfig.prefer,
  });
}

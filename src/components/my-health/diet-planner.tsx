'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Loader2, X, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MealItem { name: string; calories: number; category: string; }
interface DietPlanData { ok: boolean; dietName: string; dailyCalories: number; meals: Record<string, MealItem[]>; estimatedCalories: number; avoid: string[]; prefer: string[]; }

const CONDITIONS = [
  { value: 'general', label: 'Balanced Diet' },
  { value: 'diabetes', label: 'Diabetic Diet' },
  { value: 'hypertension', label: 'Low-Sodium (DASH)' },
  { value: 'pregnancy', label: 'Pregnancy Diet' },
  { value: 'weight-loss', label: 'Weight Loss' },
];

export function DietPlanner() {
  const [condition, setCondition] = useState('general');
  const [plan, setPlan] = useState<DietPlanData | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch('/api/diet-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ condition }) });
      if (r.ok) { setPlan(await r.json()); toast.success('Diet plan generated!'); }
      else toast.error('Failed to generate plan.');
    } catch { toast.error('Network error.'); }
    finally { setLoading(false); }
  }, [condition]);

  useEffect(() => { generate(); }, [generate]);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Utensils className="h-4 w-4 text-amber-500" /> Diet Planner</h3>
          <Select value={condition} onValueChange={(v) => { setCondition(v); }}>
            <SelectTrigger className="h-8 w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {loading ? <div className="mt-3 h-32 animate-pulse rounded-xl bg-muted/30" /> : plan && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/15 text-[9px] text-amber-700">{plan.dietName}</Badge>
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><Flame className="h-3 w-3" /> ~{plan.estimatedCalories} cal · Target: {plan.dailyCalories}</span>
            </div>
            {Object.entries(plan.meals).filter(([k]) => k !== 'dietName' && k !== 'estimatedCalories').map(([mealType, foods]) => (
              <div key={mealType}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{mealType}</p>
                <div className="flex flex-wrap gap-1">
                  {foods.map(f => <span key={f.name} className="inline-flex items-center gap-0.5 rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground">{f.name} <span className="text-muted-foreground">· {f.calories}cal</span></span>)}
                </div>
              </div>
            ))}
            {plan.avoid.length > 0 && <p className="text-[10px] text-red-600 dark:text-red-400"><span className="font-bold">Avoid:</span> {plan.avoid.join(', ')}</p>}
            {plan.prefer.length > 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400"><span className="font-bold">Prefer:</span> {plan.prefer.join(', ')}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

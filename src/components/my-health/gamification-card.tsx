'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Badge {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
}

interface GamificationData {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  badges: Badge[];
}

export function GamificationCard() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/gamification', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    // Record daily visit
    fetch('/api/gamification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'daily-visit' }) }).catch(() => {});
  }, [load]);

  if (loading || !data) return null;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Trophy className="h-4 w-4 text-amber-500" /> Your Health Journey
          </h3>
          <span className="text-xs font-bold text-primary">{data.totalPoints} pts</span>
        </div>

        {/* Streak + points row */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-muted/30 p-2 text-center">
            <Flame className="mx-auto h-5 w-5 text-orange-500" />
            <p className="mt-1 text-lg font-black text-foreground">{data.currentStreak}</p>
            <p className="text-[9px] font-semibold text-muted-foreground">Day Streak</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-2 text-center">
            <Trophy className="mx-auto h-5 w-5 text-amber-500" />
            <p className="mt-1 text-lg font-black text-foreground">{data.longestStreak}</p>
            <p className="text-[9px] font-semibold text-muted-foreground">Best Streak</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-2 text-center">
            <Star className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-lg font-black text-foreground">{data.totalPoints}</p>
            <p className="text-[9px] font-semibold text-muted-foreground">Points</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Badges</p>
          <div className="flex flex-wrap gap-1.5">
            {data.badges.map((badge) => (
              <div
                key={badge.id}
                className={cn(
                  'flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition-all',
                  badge.earned
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    : 'border-border bg-muted/20 text-muted-foreground/50',
                )}
                title={badge.earned ? badge.label : `Locked: ${badge.label}`}
              >
                <span className={badge.earned ? '' : 'opacity-40'}>{badge.icon}</span>
                <span className="hidden sm:inline">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// SehatAI — Gamification API
// GET /api/gamification → user's streak, points, badges
// POST /api/gamification { action } → record daily activity, update streak
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

const BADGES = [
  { id: 'first-chat', label: 'First Health Chat', icon: '💬', condition: (s: any) => s.totalPoints >= 10 },
  { id: '7-day-streak', label: '7 Day Streak', icon: '🔥', condition: (s: any) => s.longestStreak >= 7 },
  { id: '30-day-streak', label: '30 Day Streak', icon: '🏆', condition: (s: any) => s.longestStreak >= 30 },
  { id: 'first-appointment', label: 'First Appointment', icon: '📅', condition: (s: any, badges: string[]) => badges.includes('first-appointment') },
  { id: 'profile-complete', label: 'Profile Complete', icon: '✅', condition: (s: any, badges: string[]) => badges.includes('profile-complete') },
  { id: 'first-review', label: 'First Review', icon: '⭐', condition: (s: any, badges: string[]) => badges.includes('first-review') },
];

export async function GET() {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let streak = await db.userStreak.findUnique({ where: { userId: user.id } });
  if (!streak) {
    streak = await db.userStreak.create({ data: { userId: user.id } });
  }
  const earnedBadges = JSON.parse(streak.badges) as string[];
  const allBadges = BADGES.map(b => ({ ...b, earned: earnedBadges.includes(b.id) || b.condition(streak!, earnedBadges) }));
  return NextResponse.json({
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    totalPoints: streak.totalPoints,
    lastActiveDate: streak.lastActiveDate?.toISOString() ?? null,
    badges: allBadges,
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { action?: string };
  try { body = await req.json(); } catch { body = {}; }
  const action = body.action ?? 'daily-visit';
  const pointsMap: Record<string, number> = { 'daily-visit': 10, 'chat': 5, 'appointment': 50, 'review': 20, 'profile-complete': 30 };
  const points = pointsMap[action] ?? 5;

  let streak = await db.userStreak.findUnique({ where: { userId: user.id } });
  if (!streak) {
    streak = await db.userStreak.create({ data: { userId: user.id } });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null;
  let newStreak = streak.currentStreak;
  if (lastActive) {
    const lastActiveDay = new Date(lastActive);
    lastActiveDay.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) newStreak = streak.currentStreak + 1;
    else if (diffDays > 1) newStreak = 1;
  } else {
    newStreak = 1;
  }

  const updated = await db.userStreak.update({
    where: { userId: user.id },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      totalPoints: streak.totalPoints + points,
      lastActiveDate: new Date(),
    },
  });

  // Auto-award badges
  const earnedBadges = new Set(JSON.parse(updated.badges) as string[]);
  for (const badge of BADGES) {
    if (!earnedBadges.has(badge.id) && badge.condition(updated, Array.from(earnedBadges))) {
      earnedBadges.add(badge.id);
    }
  }
  await db.userStreak.update({
    where: { userId: user.id },
    data: { badges: JSON.stringify(Array.from(earnedBadges)) },
  });

  return NextResponse.json({
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    totalPoints: updated.totalPoints,
    pointsEarned: points,
    newBadges: Array.from(earnedBadges).filter(b => !JSON.parse(streak.badges).includes(b)),
  });
}

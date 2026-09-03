// SehatAI — Community Forum API
// GET /api/community?category= → list posts
// POST /api/community { title, content, category } → create post
// POST /api/community { postId, reply, content } → reply to a post
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const where: { isModerated?: boolean; category?: string } = { isModerated: true };
  if (category && category !== 'all') where.category = category;

  const posts = await db.communityPost.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 30,
  });
  return NextResponse.json({
    posts: posts.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      category: p.category,
      upvotes: p.upvotes,
      replies: p.replies,
      authorName: p.user.name ?? 'Anonymous',
      isPinned: p.isPinned,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { title?: string; content?: string; category?: string; postId?: string; reply?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Reply to a post
  if (body.reply && body.postId) {
    if (!body.content) return NextResponse.json({ error: 'content is required' }, { status: 400 });
    const reply = await db.communityReply.create({
      data: { postId: body.postId, userId: user.id, content: body.content },
    });
    await db.communityPost.update({
      where: { id: body.postId },
      data: { replies: { increment: 1 } },
    });
    return NextResponse.json({ ok: true, replyId: reply.id });
  }

  // Create a new post
  if (!body.title || !body.content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }
  const post = await db.communityPost.create({
    data: {
      userId: user.id,
      title: body.title.slice(0, 200),
      content: body.content.slice(0, 5000),
      category: body.category ?? 'general',
      // Auto-moderate: mark as moderated for now (in production, use AI moderation)
      isModerated: true,
    },
  });
  return NextResponse.json({ ok: true, postId: post.id });
}

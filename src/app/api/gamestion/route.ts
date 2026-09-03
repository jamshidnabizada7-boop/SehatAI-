// ============================================================
// SehatAI — /api/gamestion (typo-tolerant alias of /api/gamification)
//
// Re-exports the exact same GET/POST handlers as /api/gamification
// so clients hitting either path get identical behaviour. Kept as a
// separate file (not a runtime redirect) so the route is statically
// registered by Next.js without an extra hop.
// ============================================================
export const runtime = 'nodejs';
export { GET, POST } from '@/app/api/gamification/route';

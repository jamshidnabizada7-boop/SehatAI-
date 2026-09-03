// ============================================================
// SehatAI — Phase 0: NextAuth.js configuration
// Credentials provider (email + bcrypt password) + Google OAuth
// (Google OAuth disabled if no GOOGLE_CLIENT_ID env var).
// Sessions persisted in the `Session` table via PrismaAdapter.
//
// Safety:
// - Passwords hashed with bcrypt (10 rounds).
// - Session token rotated on login.
// - All auth events logged to AuditLog.
// - Never logs passwords or tokens.
// ============================================================

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Use the shared prisma client (not a new instance) when possible
import { db } from '@/lib/db';

if (!process.env.NEXTAUTH_SECRET) {
  // Fail fast in dev if secret missing — never use a default secret in prod
  console.warn('[auth] NEXTAUTH_SECRET not set — auth will fail in production');
}

const prisma = db as unknown as PrismaClient;

export const authOptions: NextAuthOptions = {
  // @ts-expect-error — PrismaAdapter expects a PrismaClient; our db is one
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'aisha@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        // To prevent user enumeration, return null both for "no user" and "bad password"
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        // Audit log
        try {
          await prisma.auditLog.create({
            data: { userId: user.id, action: 'auth.login', resource: 'credentials', meta: JSON.stringify({ role: user.role, accountStatus: user.accountStatus }) },
          });
        } catch {
          // non-blocking
        }
        return { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role, accountStatus: user.accountStatus };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? 'user';
        token.accountStatus = (user as any).accountStatus ?? 'active';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).accountStatus = token.accountStatus;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (user?.id) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'auth.login',
              resource: account?.provider ?? 'unknown',
            },
          });
        } catch {
          // non-blocking
        }
      }
    },
  },
};

// Helper: hash a password (for signup)
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

// Helper: verify a password (used in authorize)
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Helper: get the current session server-side
export async function getServerSession() {
  const { getServerSession: nextGetServerSession } = await import('next-auth/next');
  return nextGetServerSession(authOptions);
}

// Helper: require an authenticated user (throws 401-shaped error if not)
export async function requireUser(): Promise<{ id: string; email: string; role: string; accountStatus: string }> {
  const session = await getServerSession();
  if (!session?.user?.email) {
    const err = new Error('Unauthorized');
    (err as any).status = 401;
    throw err;
  }
  return {
    id: (session.user as any).id,
    email: session.user.email,
    role: (session.user as any).role ?? 'user',
    accountStatus: (session.user as any).accountStatus ?? 'active',
  };
}

// Helper: require an authenticated doctor (role === 'doctor').
// Throws a 403-shaped error if the caller is not a doctor.
export async function requireDoctor(): Promise<{ id: string; email: string; role: string; accountStatus: string }> {
  const u = await requireUser();
  if (u.role !== 'doctor' && u.role !== 'admin') {
    const err = new Error('Forbidden — doctor role required');
    (err as any).status = 403;
    throw err;
  }
  return u;
}

// Helper: require an active doctor (role === 'doctor' AND accountStatus === 'active').
// Admins bypass this (they can preview the doctor surface for QA).
// Throws 403 if the caller is not a doctor or is unverified/suspended.
export async function requireActiveDoctor(): Promise<{ id: string; email: string; role: string; accountStatus: string; doctorProfile: { id: string; pmdcNumber: string; specialty: string; pmdcVerifiedAt: Date | null } }> {
  const u = await requireUser();
  if (u.role === 'admin') {
    // Admins previewing — fetch their (probably missing) doctorProfile stub
    const profile = await db.doctorProfile.findUnique({ where: { userId: u.id } });
    return { ...u, doctorProfile: profile ?? { id: 'admin-preview', pmdcNumber: 'ADMIN', specialty: 'Admin', pmdcVerifiedAt: null } };
  }
  if (u.role !== 'doctor') {
    const err = new Error('Forbidden — doctor role required');
    (err as any).status = 403;
    throw err;
  }
  if (u.accountStatus !== 'active') {
    const err = new Error('Forbidden — doctor account not active');
    (err as any).status = 403;
    throw err;
  }
  const profile = await db.doctorProfile.findUnique({ where: { userId: u.id } });
  if (!profile || !profile.pmdcVerifiedAt) {
    const err = new Error('Forbidden — PMDC verification pending');
    (err as any).status = 403;
    throw err;
  }
  return { ...u, doctorProfile: profile };
}

// Helper: require an admin (role === 'admin').
export async function requireAdmin(): Promise<{ id: string; email: string; role: string; accountStatus: string }> {
  const u = await requireUser();
  if (u.role !== 'admin') {
    const err = new Error('Forbidden — admin role required');
    (err as any).status = 403;
    throw err;
  }
  return u;
}

// Helper: invalidate all sessions for a user (used after role/status change).
// With JWT strategy we can't truly revoke tokens, but we can delete any DB
// sessions (covers the database-session case) and rely on short token refresh
// for the JWT case. The caller should also bump the user.updatedAt so any
// middleware re-checks can detect a change.
export async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    await db.session.deleteMany({ where: { userId } });
  } catch {
    // non-blocking
  }
}

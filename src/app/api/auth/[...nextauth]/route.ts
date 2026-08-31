// SehatAI — NextAuth.js catch-all API route
// GET/POST /api/auth/signin, /signout, /session, /csrf, /callback/*
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

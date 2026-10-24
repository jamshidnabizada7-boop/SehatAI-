/** Resolve lazily: builds may import modules, but production operations must fail closed. */
export function careSecret(name: string, developmentFallback: string, allowAuthFallback = true): string {
  const configured = process.env[name] || (allowAuthFallback ? process.env.NEXTAUTH_SECRET : undefined);
  if (process.env.NODE_ENV === 'production' && (!configured || configured.length < 32 || /^(?:dev-|test-|ci-|change-me)/i.test(configured))) {
    throw new Error(`PROVIDER_NOT_CONFIGURED: ${name} requires a production secret of at least 32 characters`);
  }
  return configured || developmentFallback;
}

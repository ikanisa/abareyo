/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Error classes for Supabase client operations
 * Separated from db.ts to avoid "use server" directive conflicts
 */

export class SupabaseClientAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseClientAccessError';
  }
}

export class SupabaseClientUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseClientUnavailableError';
  }
}

/**
 * Error classes for Admin Service Client operations
 * Separated from service-client.ts to avoid "use server" directive conflicts
 */

export class AdminServiceClientUnavailableError extends Error {
  constructor(message = 'Supabase service role client is not configured') {
    super(message);
    this.name = 'AdminServiceClientUnavailableError';
  }
}

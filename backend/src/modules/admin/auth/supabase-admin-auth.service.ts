import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAdminAuthService {
  private readonly logger = new Logger(SupabaseAdminAuthService.name);
  private readonly client: SupabaseClient | null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');

    if (!url || !serviceRoleKey) {
      this.client = null;
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn('Supabase admin authentication is not fully configured.');
      }
      return;
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  get isEnabled() {
    return this.client !== null;
  }

  async getUserFromAccessToken(accessToken: string): Promise<User> {
    if (!this.client) {
      throw new ServiceUnavailableException('Supabase admin authentication is not configured.');
    }

    if (!accessToken?.trim()) {
      throw new UnauthorizedException('A Supabase access token is required.');
    }

    const { data, error } = await this.client.auth.getUser(accessToken);

    if (error || !data.user) {
      this.logger.warn(
        JSON.stringify({
          event: 'admin.auth.supabase.invalidToken',
          error: error?.message ?? 'unknown',
        }),
      );
      throw new UnauthorizedException('Invalid Supabase access token.');
    }

    if (!data.user.email) {
      throw new UnauthorizedException('Supabase account is missing an email address.');
    }

    return data.user;
  }
}


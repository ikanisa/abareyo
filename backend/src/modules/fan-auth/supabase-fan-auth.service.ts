import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseFanAuthService {
  private readonly logger = new Logger(SupabaseFanAuthService.name);
  private readonly client: SupabaseClient | null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');

    if (!url || !serviceRoleKey) {
      this.client = null;
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn('Supabase fan authentication is not fully configured.');
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
      throw new ServiceUnavailableException('Supabase fan authentication is not configured.');
    }

    if (!accessToken?.trim()) {
      throw new UnauthorizedException('A Supabase access token is required.');
    }

    const { data, error } = await this.client.auth.getUser(accessToken);

    if (error || !data.user) {
      this.logger.warn(
        JSON.stringify({
          event: 'fan.auth.supabase.invalidToken',
          error: error?.message ?? 'unknown',
        }),
      );
      throw new UnauthorizedException('Invalid Supabase access token.');
    }

    return data.user;
  }
}

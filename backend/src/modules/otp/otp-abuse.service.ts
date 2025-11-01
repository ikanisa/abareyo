import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  describePhoneValidation,
  normalizeInternationalPhoneNumber,
} from '../onboarding/phone.util.js';
import { OtpStore } from './otp.store.js';

export type OtpBlacklistEntry = {
  value: string;
  masked: string;
  source: 'config' | 'runtime';
  note?: string | null;
};

@Injectable()
export class OtpAbuseService {
  private readonly logger = new Logger(OtpAbuseService.name);
  private readonly configPhones: Set<string>;
  private readonly configIps: Set<string>;

  constructor(private readonly configService: ConfigService, private readonly store: OtpStore) {
    const phoneValues = this.configService.get<string[]>('otp.blacklists.phone', []) ?? [];
    this.configPhones = new Set(
      phoneValues
        .map((value) => this.normalisePhone(value))
        .filter((value): value is string => Boolean(value)),
    );

    const ipValues = this.configService.get<string[]>('otp.blacklists.ip', []) ?? [];
    this.configIps = new Set(
      ipValues
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    );
  }

  async checkPhone(phone: string) {
    const normalized = this.normalisePhone(phone);
    if (!normalized) {
      return { blocked: true, reason: describePhoneValidation('invalid_chars') } as const;
    }

    if (this.configPhones.has(normalized)) {
      return { blocked: true, reason: 'Phone number blocked by configuration.', source: 'config' as const };
    }

    const runtime = await this.store.listBlacklist('phone');
    if (runtime.includes(normalized)) {
      const notes = await this.store.getBlacklistNotes('phone');
      return {
        blocked: true,
        reason: notes[normalized] ?? 'Phone number blocked by runtime blacklist.',
        source: 'runtime' as const,
      };
    }

    return { blocked: false, value: normalized } as const;
  }

  async checkIp(ip?: string | null) {
    if (!ip) {
      return { blocked: false } as const;
    }
    const value = ip.trim();
    if (!value) {
      return { blocked: false } as const;
    }

    if (this.configIps.has(value)) {
      return { blocked: true, reason: 'IP blocked by configuration.', source: 'config' as const };
    }

    const runtime = await this.store.listBlacklist('ip');
    if (runtime.includes(value)) {
      const notes = await this.store.getBlacklistNotes('ip');
      return {
        blocked: true,
        reason: notes[value] ?? 'IP blocked by runtime blacklist.',
        source: 'runtime' as const,
      };
    }

    return { blocked: false, value } as const;
  }

  async listPhoneBlacklist(): Promise<OtpBlacklistEntry[]> {
    const runtime = await this.store.listBlacklist('phone');
    const notes = await this.store.getBlacklistNotes('phone');
    const combined = new Map<string, OtpBlacklistEntry>();

    for (const value of this.configPhones) {
      combined.set(value, {
        value,
        masked: this.maskPhone(value),
        source: 'config',
        note: 'Configured via OTP_BLOCKED_NUMBERS environment variable.',
      });
    }

    for (const value of runtime) {
      combined.set(value, {
        value,
        masked: this.maskPhone(value),
        source: 'runtime',
        note: notes[value] ?? null,
      });
    }

    return Array.from(combined.values()).sort((a, b) => a.masked.localeCompare(b.masked));
  }

  async listIpBlacklist(): Promise<OtpBlacklistEntry[]> {
    const runtime = await this.store.listBlacklist('ip');
    const notes = await this.store.getBlacklistNotes('ip');
    const combined = new Map<string, OtpBlacklistEntry>();

    for (const value of this.configIps) {
      combined.set(value, {
        value,
        masked: this.maskIp(value),
        source: 'config',
        note: 'Configured via OTP_BLOCKED_IPS environment variable.',
      });
    }

    for (const value of runtime) {
      combined.set(value, {
        value,
        masked: this.maskIp(value),
        source: 'runtime',
        note: notes[value] ?? null,
      });
    }

    return Array.from(combined.values()).sort((a, b) => a.masked.localeCompare(b.masked));
  }

  async addPhoneToBlacklist(phone: string, note?: string | null) {
    const normalized = this.normalisePhone(phone);
    if (!normalized) {
      throw new Error(`Unable to normalise phone number: ${describePhoneValidation('invalid_chars')}`);
    }
    if (this.configPhones.has(normalized)) {
      throw new Error('Phone number already blocked via configuration.');
    }

    await this.store.addToBlacklist('phone', normalized);
    await this.store.setBlacklistNote('phone', normalized, note);
    this.logger.warn(`Runtime phone blacklist updated (${normalized}).`);
    return {
      value: normalized,
      masked: this.maskPhone(normalized),
      source: 'runtime' as const,
      note: note ?? null,
    } satisfies OtpBlacklistEntry;
  }

  async removePhoneFromBlacklist(phone: string) {
    const normalized = this.normalisePhone(phone);
    if (!normalized) {
      throw new Error('Phone number invalid.');
    }
    if (this.configPhones.has(normalized)) {
      throw new Error('Cannot remove configuration-managed phone blacklist entries.');
    }
    await this.store.removeFromBlacklist('phone', normalized);
    return normalized;
  }

  async addIpToBlacklist(ip: string, note?: string | null) {
    const trimmed = ip.trim();
    if (!trimmed) {
      throw new Error('IP address is required.');
    }
    if (this.configIps.has(trimmed)) {
      throw new Error('IP already blocked via configuration.');
    }

    await this.store.addToBlacklist('ip', trimmed);
    await this.store.setBlacklistNote('ip', trimmed, note);
    this.logger.warn(`Runtime IP blacklist updated (${trimmed}).`);
    return {
      value: trimmed,
      masked: this.maskIp(trimmed),
      source: 'runtime' as const,
      note: note ?? null,
    } satisfies OtpBlacklistEntry;
  }

  async removeIpFromBlacklist(ip: string) {
    const trimmed = ip.trim();
    if (!trimmed) {
      throw new Error('IP address is required.');
    }
    if (this.configIps.has(trimmed)) {
      throw new Error('Cannot remove configuration-managed IP blacklist entries.');
    }
    await this.store.removeFromBlacklist('ip', trimmed);
    return trimmed;
  }

  private normalisePhone(input: string | undefined | null) {
    const result = normalizeInternationalPhoneNumber(input);
    return result.normalized ?? null;
  }

  private maskPhone(value: string) {
    const digits = value.replace(/[^0-9]/g, '');
    if (digits.length <= 4) {
      return value;
    }
    const visible = digits.slice(-4);
    return `${value.slice(0, 3)}••••${visible}`;
  }

  private maskIp(value: string) {
    if (value.includes(':')) {
      return value.replace(/([0-9a-f]{1,4})(?::|$)/gi, (segment, group) => {
        return group.length <= 1 ? '•' : `${group.slice(0, 1)}••`;
      });
    }

    const parts = value.split('.');
    if (parts.length !== 4) {
      return value;
    }
    return `${parts[0]}.${parts[1]}.••.••`;
  }
}

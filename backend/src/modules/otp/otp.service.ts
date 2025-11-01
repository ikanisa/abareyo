import { randomInt } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  TooManyRequestsException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { normalizeInternationalPhoneNumber } from '../onboarding/phone.util.js';
import { OtpAbuseService } from './otp-abuse.service.js';
import { OtpMonitorService } from './otp-monitor.service.js';
import { OtpStore } from './otp.store.js';
import type { VerificationResult } from './otp.store.js';

const CHANNEL_WHATSAPP = 'whatsapp';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly ttlSeconds: number;
  private readonly codeLength: number;
  private readonly rateLimits: {
    windowSeconds: number;
    maxPerPhone: number;
    maxPerIp: number;
    cooldownSeconds: number;
    verifyWindowSeconds: number;
    maxVerifyAttempts: number;
  };
  private readonly templateApproved: boolean;
  private readonly environment: string;

  constructor(
    private readonly store: OtpStore,
    private readonly abuse: OtpAbuseService,
    private readonly monitor: OtpMonitorService,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = this.normaliseNumber(this.configService.get<number>('otp.ttlSeconds'), 600);
    this.codeLength = this.normaliseNumber(this.configService.get<number>('otp.codeLength'), 6);
    this.rateLimits = {
      windowSeconds: this.normaliseNumber(this.configService.get<number>('otp.rateLimits.windowSeconds'), 900),
      maxPerPhone: this.normaliseNumber(this.configService.get<number>('otp.rateLimits.maxPerPhone'), 5),
      maxPerIp: this.normaliseNumber(this.configService.get<number>('otp.rateLimits.maxPerIp'), 15),
      cooldownSeconds: this.normaliseNumber(this.configService.get<number>('otp.rateLimits.cooldownSeconds'), 60),
      verifyWindowSeconds: this.normaliseNumber(
        this.configService.get<number>('otp.rateLimits.verifyWindowSeconds'),
        900,
      ),
      maxVerifyAttempts: this.normaliseNumber(
        this.configService.get<number>('otp.rateLimits.maxVerifyAttempts'),
        5,
      ),
    };
    this.templateApproved = Boolean(this.configService.get<boolean>('otp.whatsappTemplate.approved', false));
    this.environment = this.configService.get<string>('app.env', 'development');
  }

  async sendOtp(payload: { phone: string; channel?: string; ip?: string; locale?: string }) {
    const channel = payload.channel ?? CHANNEL_WHATSAPP;
    if (channel !== CHANNEL_WHATSAPP) {
      throw new BadRequestException(`Unsupported OTP channel: ${channel}`);
    }

    const normalizedPhone = this.normalizePhone(payload.phone);
    const phoneHash = this.store.hashIdentifier(normalizedPhone);
    const phoneCheck = await this.abuse.checkPhone(normalizedPhone);
    if (phoneCheck.blocked) {
      await this.monitor.recordSend({
        kind: 'send',
        phoneHash,
        channel,
        ip: payload.ip,
        status: 'blocked',
        templateApproved: this.templateApproved,
        reason: phoneCheck.reason ?? 'Blocked phone number',
      });
      throw new ForbiddenException(phoneCheck.reason ?? 'Phone number is blocked for OTP delivery.');
    }

    const ipCheck = await this.abuse.checkIp(payload.ip);
    if (ipCheck.blocked) {
      await this.monitor.recordSend({
        kind: 'send',
        phoneHash,
        channel,
        ip: payload.ip,
        status: 'blocked',
        templateApproved: this.templateApproved,
        reason: ipCheck.reason ?? 'IP blocked',
      });
      throw new ForbiddenException(ipCheck.reason ?? 'Request IP blocked for OTP delivery.');
    }

    const phoneKey = `phone:${phoneHash}`;
    const ipKey = ipCheck.value ? `ip:${this.store.hashIdentifier(ipCheck.value)}` : null;

    const cooldownRemaining = await this.store.getCooldownRemaining(phoneKey);
    if (cooldownRemaining > 0) {
      await this.monitor.recordSend({
        kind: 'send',
        phoneHash,
        channel,
        ip: payload.ip,
        status: 'rate_limited',
        templateApproved: this.templateApproved,
        reason: `Cooling down for ${Math.ceil(cooldownRemaining / 1000)}s`,
      });
      throw new TooManyRequestsException(
        `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting another OTP.`,
      );
    }

    const phoneAttempts = await this.store.incrementWindowCounter(phoneKey, this.rateLimits.windowSeconds);
    if (phoneAttempts > this.rateLimits.maxPerPhone) {
      await this.monitor.recordSend({
        kind: 'send',
        phoneHash,
        channel,
        ip: payload.ip,
        status: 'rate_limited',
        templateApproved: this.templateApproved,
        reason: 'Per-number rate limit exceeded.',
      });
      throw new TooManyRequestsException('Too many OTP requests for this number. Try again later.');
    }

    if (ipKey) {
      const ipAttempts = await this.store.incrementWindowCounter(ipKey, this.rateLimits.windowSeconds);
      if (ipAttempts > this.rateLimits.maxPerIp) {
        await this.monitor.recordSend({
          kind: 'send',
          phoneHash,
          channel,
          ip: payload.ip,
          status: 'rate_limited',
          templateApproved: this.templateApproved,
          reason: 'Per-IP rate limit exceeded.',
        });
        throw new TooManyRequestsException('Too many OTP requests from this network. Try again later.');
      }
    }

    if (!this.templateApproved) {
      await this.monitor.recordSend({
        kind: 'send',
        phoneHash,
        channel,
        ip: payload.ip,
        status: 'error',
        templateApproved: this.templateApproved,
        reason: 'WhatsApp template not approved.',
      });
      throw new BadRequestException(
        'WhatsApp OTP template is not yet approved. Submit the template before delivering OTP codes.',
      );
    }

    const code = this.generateCode();
    await this.store.storeCode(phoneHash, code, this.ttlSeconds);
    await this.store.startCooldown(phoneKey, this.rateLimits.cooldownSeconds);

    this.logger.log(
      JSON.stringify({
        event: 'otp.send',
        channel,
        phoneHash,
        ttlSeconds: this.ttlSeconds,
        locale: payload.locale ?? null,
      }),
    );

    await this.monitor.recordSend({
      kind: 'send',
      phoneHash,
      channel,
      ip: payload.ip,
      status: 'delivered',
      locale: payload.locale,
      templateApproved: this.templateApproved,
    });

    const response: { expiresIn: number; templateApproved: boolean; testCode?: string } = {
      expiresIn: this.ttlSeconds,
      templateApproved: this.templateApproved,
    };
    if (this.environment !== 'production') {
      response.testCode = code;
    }
    return response;
  }

  async verifyOtp(payload: { phone: string; code: string; ip?: string }) {
    const normalizedPhone = this.normalizePhone(payload.phone);
    const phoneHash = this.store.hashIdentifier(normalizedPhone);

    const ipCheck = await this.abuse.checkIp(payload.ip);
    if (ipCheck.blocked) {
      await this.monitor.recordVerification({
        kind: 'verify',
        phoneHash,
        ip: payload.ip,
        status: 'failed',
        reason: ipCheck.reason ?? 'IP blocked',
      });
      throw new ForbiddenException(ipCheck.reason ?? 'Request IP blocked for OTP verification.');
    }

    const result = await this.store.verifyCode(phoneHash, payload.code, this.rateLimits.maxVerifyAttempts);

    return this.handleVerificationResult(result, phoneHash, payload);
  }

  private async handleVerificationResult(
    result: VerificationResult,
    phoneHash: string,
    payload: { ip?: string; code: string },
  ) {
    if (result.status === 'verified') {
      await this.monitor.recordVerification({
        kind: 'verify',
        phoneHash,
        ip: payload.ip,
        status: 'success',
      });
      return { status: 'verified' } as const;
    }

    if (result.status === 'not_found') {
      await this.monitor.recordVerification({
        kind: 'verify',
        phoneHash,
        ip: payload.ip,
        status: 'failed',
        reason: 'Code not found',
      });
      throw new BadRequestException('Invalid or expired OTP code. Request a new one.');
    }

    if (result.status === 'expired') {
      await this.monitor.recordVerification({
        kind: 'verify',
        phoneHash,
        ip: payload.ip,
        status: 'expired',
      });
      throw new BadRequestException('OTP code has expired. Request a new one.');
    }

    if (result.status === 'locked') {
      await this.monitor.recordVerification({
        kind: 'verify',
        phoneHash,
        ip: payload.ip,
        status: 'locked',
      });
      throw new TooManyRequestsException('Too many incorrect attempts. Request a new OTP.');
    }

    await this.monitor.recordVerification({
      kind: 'verify',
      phoneHash,
      ip: payload.ip,
      status: 'failed',
      reason: 'Incorrect code',
    });

    const attemptsRemaining = 'attemptsRemaining' in result ? result.attemptsRemaining : undefined;
    if (attemptsRemaining !== undefined) {
      throw new BadRequestException(
        `Incorrect code. You have ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
      );
    }

    throw new BadRequestException('Incorrect OTP code.');
  }

  getOperationalStatus() {
    return {
      ttlSeconds: this.ttlSeconds,
      templateApproved: this.templateApproved,
      rateLimits: this.rateLimits,
      redis: this.store.getRedisStatus(),
    } as const;
  }

  private normalizePhone(phone: string) {
    const result = normalizeInternationalPhoneNumber(phone);
    if (!result.normalized) {
      throw new BadRequestException(result.reason ? describeReason(result.reason) : 'Invalid phone number.');
    }
    return result.normalized;
  }

  private normaliseNumber(value: number | undefined | null, fallback: number) {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      return fallback;
    }
    return value;
  }

  private generateCode() {
    const max = 10 ** this.codeLength;
    const min = 10 ** (this.codeLength - 1);
    const value = randomInt(min, max);
    return value.toString().padStart(this.codeLength, '0');
  }
}

const describeReason = (reason: string) => {
  switch (reason) {
    case 'missing':
    case 'empty':
      return 'WhatsApp number is required.';
    case 'non_numeric':
    case 'invalid_chars':
      return 'WhatsApp number must only contain digits and an optional leading + sign.';
    case 'length':
      return 'WhatsApp number must be between 10 and 15 digits long.';
    default:
      return 'Invalid WhatsApp number.';
  }
};

import { Injectable, TooManyRequestsException } from '@nestjs/common';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface AttemptState {
  count: number;
  firstAttempt: number;
}

@Injectable()
export class LoginRateLimiterService {
  private readonly attempts = new Map<string, AttemptState>();

  registerAttempt(key: string) {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return;
    }

    if (now - attempt.firstAttempt > WINDOW_MS) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return;
    }

    if (attempt.count + 1 > MAX_ATTEMPTS) {
      throw new TooManyRequestsException('Too many login attempts. Please try again soon.');
    }

    attempt.count += 1;
    this.attempts.set(key, attempt);
  }

  reset(key: string) {
    this.attempts.delete(key);
  }
}

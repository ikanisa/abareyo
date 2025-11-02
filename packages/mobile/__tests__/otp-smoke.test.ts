import {
  startWhatsappAuth,
  submitOnboarding,
  verifyWhatsappCode,
} from '../app/(onboarding)/api';
import { getAuthToken, saveAuthToken } from '../app/(onboarding)/authStorage';

type FetchMock = jest.MockedFunction<typeof fetch>;

jest.mock('../app/(onboarding)/authStorage', () => {
  let token: string | null = null;
  return {
    saveAuthToken: jest.fn(async (value: string) => {
      token = value;
    }),
    getAuthToken: jest.fn(async () => token),
    setInMemoryToken: jest.fn((value: string | null) => {
      token = value;
    }),
  };
});

describe('mobile OTP smoke tests', () => {
  const originalFetch = global.fetch;
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = jest.fn() as FetchMock;
    (global as unknown as { fetch: FetchMock }).fetch = fetchMock;
    (saveAuthToken as jest.Mock).mockClear();
    (getAuthToken as jest.Mock).mockClear();
  });

  afterAll(() => {
    (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  });

  it('starts WhatsApp verification with the expected payload', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sessionId: 'session-123',
        expiresAt: '2024-01-01T00:00:00Z',
        resendAt: '2024-01-01T00:02:00Z',
      }),
      text: async () => '',
    } as Response);

    const response = await startWhatsappAuth('+250788123456');

    expect(fetchMock).toHaveBeenCalledWith('https://mobile.abareyo.dev/auth/whatsapp/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappNumber: '+250788123456' }),
    });
    expect(response).toEqual({
      sessionId: 'session-123',
      expiresAt: '2024-01-01T00:00:00Z',
      resendAt: '2024-01-01T00:02:00Z',
    });
  });

  it('verifies the OTP code and surfaces the auth token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'token-xyz', userId: 'fan-001' }),
      text: async () => '',
    } as Response);

    const result = await verifyWhatsappCode('session-123', '987654');

    expect(fetchMock).toHaveBeenCalledWith('https://mobile.abareyo.dev/auth/whatsapp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'session-123', code: '987654' }),
    });
    expect(result).toEqual({ token: 'token-xyz', userId: 'fan-001' });
  });

  it('submits onboarding preferences with the persisted token', async () => {
    await saveAuthToken('token-xyz');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'fan-002', code: 'ABY-002' }),
        text: async () => '',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => '',
      } as Response);

    const onboardingResult = await submitOnboarding({
      whatsappNumber: '+250788123456',
      momoNumber: '+250788123456',
      useWhatsappForMomo: false,
      language: 'en',
      publicProfile: true,
      notifications: {
        kickoff: true,
        goals: true,
        final: true,
        club: false,
      },
    });

    const onboardingCall = fetchMock.mock.calls[0];
    expect(onboardingCall?.[0]).toBe('https://mobile.abareyo.dev/api/me/onboarding');
    expect(onboardingCall?.[1]).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-xyz',
      },
    });
    const onboardingBody = JSON.parse(String((onboardingCall?.[1] as RequestInit).body ?? '{}'));
    expect(onboardingBody).toMatchObject({
      whatsappNumber: '+250788123456',
      useWhatsappForMomo: false,
      momoNumber: '+250788123456',
      publicProfile: true,
    });
    expect(typeof onboardingBody.user_id).toBe('string');

    const prefsCall = fetchMock.mock.calls[1];
    expect(prefsCall?.[0]).toBe('https://mobile.abareyo.dev/api/me/prefs');
    expect(prefsCall?.[1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-xyz',
        'x-user-id': 'fan-002',
      }),
    });
    expect(onboardingResult).toEqual({ userId: 'fan-002', userCode: 'ABY-002' });
  });
});

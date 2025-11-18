const resolveBaseUrl = () => {
  const envCandidates = [
    process.env.EXPO_PUBLIC_WEB_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];

  return envCandidates.find((value) => typeof value === 'string' && value.length > 0)?.replace(/\/$/, '') ?? 'http://localhost:3000';
};

const baseUrl = resolveBaseUrl();

export type RequestOtpResponse = {
  correlationId: string;
};

export type VerifyOtpResponse = {
  token: string;
};

export const requestOtp = async (phoneNumber: string): Promise<RequestOtpResponse> => {
  const response = await fetch(`${baseUrl}/api/mobile/whatsapp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to request OTP');
  }

  return response.json();
};

export const verifyOtp = async (phoneNumber: string, code: string): Promise<VerifyOtpResponse> => {
  const response = await fetch(`${baseUrl}/api/mobile/whatsapp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to verify OTP');
  }

  return response.json();
};

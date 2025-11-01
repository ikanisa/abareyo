import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before imports
vi.mock('@/app/_lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

describe('SMS Process API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    const { getSupabase } = await import('@/app/_lib/supabase');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const { POST } = await import('@/app/api/sms/process/route');
    const request = new Request('http://localhost:3000/api/sms/process', {
      method: 'POST',
      body: JSON.stringify({ text: 'Test SMS' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should require SMS text in request body', async () => {
    const { getSupabase } = await import('@/app/_lib/supabase');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const { POST } = await import('@/app/api/sms/process/route');
    const request = new Request('http://localhost:3000/api/sms/process', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('SMS text is required');
  });

  it('should handle database unavailable', async () => {
    const { getSupabase } = await import('@/app/_lib/supabase');
    vi.mocked(getSupabase).mockReturnValue(null);

    const { POST } = await import('@/app/api/sms/process/route');
    const request = new Request('http://localhost:3000/api/sms/process', {
      method: 'POST',
      body: JSON.stringify({ text: 'Test SMS' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Database unavailable');
  });
});

describe('Mobile Money Payments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication for GET', async () => {
    const { getSupabase } = await import('@/app/_lib/supabase');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const { GET } = await import('@/app/api/payments/mobile-money/route');
    const request = new Request('http://localhost:3000/api/payments/mobile-money', {
      method: 'GET',
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle database unavailable for GET', async () => {
    const { getSupabase } = await import('@/app/_lib/supabase');
    vi.mocked(getSupabase).mockReturnValue(null);

    const { GET } = await import('@/app/api/payments/mobile-money/route');
    const request = new Request('http://localhost:3000/api/payments/mobile-money', {
      method: 'GET',
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Database unavailable');
  });
});

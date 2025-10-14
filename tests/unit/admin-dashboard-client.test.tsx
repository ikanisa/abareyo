import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/providers/admin-locale-provider', () => ({
  useAdminLocale: () => ({
    locale: 'en',
    setLocale: vi.fn(),
    dictionary: {},
    loading: false,
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

import { AdminDashboardClient } from '@/components/admin/dashboard/AdminDashboardClient';
import type { DashboardSnapshot } from '@/services/admin/dashboard';

describe('AdminDashboardClient', () => {
  it('renders KPI, telemetry, and alert panels with snapshot data', () => {
    const snapshot: DashboardSnapshot = {
      generatedAt: '2024-05-05T10:00:00.000Z',
      kpis: [
        { key: 'tickets', label: 'Tickets sold', value7d: 120, value30d: 480, trend: 0, format: 'count' },
        { key: 'gmv', label: 'Shop GMV (RWF)', value7d: 900000, value30d: 3200000, trend: null, format: 'currency' },
        { key: 'policies', label: 'Policies issued', value7d: 24, value30d: 96, trend: null, format: 'count' },
        { key: 'deposits', label: 'SACCO deposits (RWF)', value7d: 1500000, value30d: 6000000, trend: null, format: 'currency' },
      ],
      sms: {
        rawCount7d: 140,
        parsedCount7d: 110,
        successRate: 0.7857,
        averageLatencySeconds: 42,
      },
      payments: {
        confirmedCount7d: 58,
        pendingCount: 3,
        averageConfirmationSeconds: 780,
      },
      gates: {
        windowHours: 24,
        totalPasses: 180,
        breakdown: [
          { gate: 'Gate A', passes: 120 },
          { gate: 'Gate B', passes: 60 },
        ],
      },
      alerts: [],
    };

    render(<AdminDashboardClient snapshot={snapshot} />);

    expect(screen.getByText('Tickets sold')).toBeInTheDocument();
    expect(screen.getByText('SMS Parser Health')).toBeInTheDocument();
    expect(screen.getByText('Payment SLA')).toBeInTheDocument();
    expect(screen.getByText('Gate Throughput')).toBeInTheDocument();
    expect(
      screen.getByText('All systems nominal. No alerts triggered in the last refresh.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Refreshed/)).toBeInTheDocument();
  });
});

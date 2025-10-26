import { httpClient } from '@/services/http-client';

export type AdminReportsOverview = {
  range: { from: string | null; to: string | null };
  shop: {
    totalRevenue: number;
    outstandingCount: number;
    readyForPickupCount: number;
    fulfilledCount: number;
    totalsByStatus: Record<string, number>;
  };
  fundraising: {
    totalRaised: number;
    pendingAmount: number;
    activeProjects: number;
    topProjects: Array<{ id: string; title: string; status: string; goal: number; progress: number; percent: number }>;
    dailySeries: Array<{ date: string; value: number }>;
  };
  membership: {
    total: number;
    active: number;
    pending: number;
    cancelled: number;
    autoRenewEnabled: number;
    expiringSoon: number;
    planSeries: Array<{ planId: string | null; planName: string; members: number }>;
  };
};

export const fetchAdminReportsOverview = async (params: { from?: string; to?: string } = {}) => {
  return httpClient.data<AdminReportsOverview>('/admin/reports/overview', {
    admin: true,
    searchParams: params,
  });
};

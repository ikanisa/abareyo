"use client";

import { useMemo, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, BarChart3, Clock3, DollarSign, Ticket, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { fetchTicketAnalytics, type TicketAnalyticsContract } from "@/lib/api/tickets";

const currencyFormatter = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const summaryIcons: Partial<Record<SummaryKey, ComponentType<{ className?: string }>>> = {
  revenue: DollarSign,
  orders: Ticket,
  paid: TrendingUp,
  pending: Clock3,
  cancelled: Activity,
  expired: Clock3,
  averageOrderValue: DollarSign,
};

type SummaryKey = keyof TicketAnalyticsContract["totals"];

const summaryLabels: Record<SummaryKey, { label: string; helper: string }> = {
  revenue: { label: "Total revenue", helper: "Confirmed ticket payments" },
  orders: { label: "Total orders", helper: "All ticket orders" },
  paid: { label: "Paid", helper: "Orders confirmed via SMS" },
  pending: { label: "Pending", helper: "Awaiting payment" },
  cancelled: { label: "Cancelled", helper: "Orders cancelled manually" },
  expired: { label: "Expired", helper: "USSD timed out" },
  averageOrderValue: { label: "Average order", helper: "Revenue / orders" },
};

const SUMMARY_ORDER: SummaryKey[] = ["revenue", "orders", "paid", "pending", "cancelled", "expired", "averageOrderValue"];

const formatSummaryValue = (key: SummaryKey, value: number) => {
  if (key === "revenue" || key === "averageOrderValue") {
    return currencyFormatter.format(value);
  }
  return numberFormatter.format(value);
};

const AdminTicketsView = () => {
  const analyticsQuery = useQuery({
    queryKey: ["tickets", "analytics"],
    queryFn: fetchTicketAnalytics,
  });

  const analytics = analyticsQuery.data;
  const salesChartData = useMemo(() => {
    if (!analytics?.recentSales.length) {
      return [];
    }
    return analytics.recentSales.map((item) => ({
      date: new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      revenue: item.revenue,
      orders: item.orders,
    }));
  }, [analytics?.recentSales]);

  const topMatches = useMemo(() => {
    if (!analytics?.matchBreakdown.length) {
      return [];
    }
    return [...analytics.matchBreakdown]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  }, [analytics?.matchBreakdown]);

  const paymentStatus = useMemo(() => {
    if (!analytics?.paymentStatus.length) {
      return [];
    }
    const total = analytics.paymentStatus.reduce((sum, item) => sum + item.count, 0) || 1;
    return analytics.paymentStatus.map((item) => ({
      status: item.status,
      count: item.count,
      share: Math.round((item.count / total) * 100),
    }));
  }, [analytics?.paymentStatus]);

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">Ticket Analytics</h1>
        <p className="text-muted-foreground">
          Monitor ticketing performance — revenue, order health, and match breakdowns.
        </p>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`summary-skeleton-${index}`} className="h-28" />
          ))}
          <Skeleton className="h-80 md:col-span-2 xl:col-span-3" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SUMMARY_ORDER.map((key) => (
              <SummaryCard key={key} label={summaryLabels[key].label} helper={summaryLabels[key].helper} value={formatSummaryValue(key, analytics.totals[key])} icon={summaryIcons[key]} />
            ))}
          </div>

          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent sales</h2>
                <p className="text-xs text-muted-foreground">Rolling 14-day window of confirmed revenue.</p>
              </div>
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            {salesChartData.length ? (
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    theme: { light: "hsl(var(--primary))", dark: "hsl(var(--primary))" },
                  },
                }}
                className="w-full"
              >
                <AreaChart data={salesChartData} margin={{ left: 12, right: 12, top: 20, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" className="stroke-border/60" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => currencyFormatter.format(Number(value))} />} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.2} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No confirmed payments yet.
              </div>
            )}
          </GlassCard>

          <div className="grid gap-4 xl:grid-cols-3">
            <GlassCard className="p-5 space-y-4 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Top matches</h2>
                  <p className="text-xs text-muted-foreground">Sorted by confirmed revenue.</p>
                </div>
                <Activity className="w-5 h-5 text-primary" />
              </div>
              {topMatches.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="pb-3">Match</th>
                        <th className="pb-3">Kickoff</th>
                        <th className="pb-3">Revenue</th>
                        <th className="pb-3">Paid orders</th>
                        <th className="pb-3">Seats sold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {topMatches.map((match) => {
                        const kickoff = new Date(match.kickoff);
                        return (
                          <tr key={match.matchId} className="text-foreground">
                            <td className="py-3 font-medium">Rayon Sports vs {match.opponent}</td>
                            <td className="py-3 text-muted-foreground">
                              {kickoff.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-3">{currencyFormatter.format(match.totalRevenue)}</td>
                            <td className="py-3">{numberFormatter.format(match.paidOrders)}</td>
                            <td className="py-3">
                              {match.seatsSold}/{match.capacity} ({Math.round((match.seatsSold / match.capacity) * 100)}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No paid orders yet.</div>
              )}
            </GlassCard>

            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Payment status</h2>
                  <p className="text-xs text-muted-foreground">All ticket payments across the funnel.</p>
                </div>
                <Ticket className="w-5 h-5 text-secondary" />
              </div>
              {paymentStatus.length ? (
                <div className="space-y-3">
                  {paymentStatus.map((item) => (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm text-foreground">
                        <span className="capitalize">{item.status.replace('_', ' ')}</span>
                        <span>{item.share}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-border/60">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${item.share}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{numberFormatter.format(item.count)} payments</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payment activity yet.</p>
              )}
            </GlassCard>
          </div>
        </div>
      ) : (
        <GlassCard className="p-6 text-center text-sm text-muted-foreground">Unable to load analytics.</GlassCard>
      )}
    </div>
  );
};

export default AdminTicketsView;

interface SummaryCardProps {
  label: string;
  helper: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}

function SummaryCard({ label, helper, value, icon: IconComponent }: SummaryCardProps) {
  return (
    <GlassCard className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{helper}</p>
          <h3 className="text-lg font-semibold text-foreground">{label}</h3>
        </div>
        {IconComponent ? <IconComponent className="w-6 h-6 text-primary" /> : null}
      </div>
      <p className="text-3xl font-black text-foreground">{value}</p>
    </GlassCard>
  );
}

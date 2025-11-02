import { Suspense } from "react";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rayon/ui";
import { Activity, CircleCheck, HelpCircle, ShoppingBag, Users } from "lucide-react";

import { ensureSegmentAccess } from "@/auth/guard";
import { fetchCommunityPosts, fetchOrders, fetchRewards, fetchServices, fetchTickets } from "@/data/client";

const SummaryCards = async () => {
  await ensureSegmentAccess("");
  const [tickets, orders, services, community, rewards] = await Promise.all([
    fetchTickets(),
    fetchOrders(),
    fetchServices(),
    fetchCommunityPosts(),
    fetchRewards(),
  ]);

  const openTickets = tickets.data.filter((ticket) => ticket.status === "open" || ticket.status === "pending").length;
  const pendingServices = services.data.filter((service) => service.status !== "completed").length;
  const flaggedPosts = community.data.filter((post) => post.flagged).length;
  const pendingRewards = rewards.data.filter((claim) => claim.status === "pending" || claim.status === "approved").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Open tickets</CardTitle>
          <HelpCircle className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{openTickets}</p>
          <p className="text-sm text-muted-foreground">{tickets.source === "mock" ? "Demo data" : "Live"} feed</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Orders in flight</CardTitle>
          <ShoppingBag className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{orders.data.filter((order) => order.status !== "fulfilled").length}</p>
          <p className="text-sm text-muted-foreground">Fulfilment SLA: 48h</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Services queue</CardTitle>
          <Activity className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{pendingServices}</p>
          <p className="text-sm text-muted-foreground">Upcoming engagements this week</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Reward actions</CardTitle>
          <CircleCheck className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{pendingRewards}</p>
          <p className="text-sm text-muted-foreground">Awaiting finance approval</p>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 xl:col-span-4">
        <CardHeader>
          <CardTitle>Community health</CardTitle>
          <CardDescription>Track flagged conversations requiring moderation.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Badge variant={flaggedPosts > 0 ? "warning" : "success"}>
            {flaggedPosts} flagged {flaggedPosts === 1 ? "post" : "posts"}
          </Badge>
          <Badge variant="secondary">{community.data.length} posts analysed</Badge>
          <Badge variant="secondary">Sentiment: {community.data.map((post) => post.sentiment)[0] ?? "n/a"}</Badge>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 xl:col-span-4">
        <CardHeader>
          <CardTitle>Team overview</CardTitle>
          <CardDescription>Signed-in administrators inherit permissions from Supabase roles.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>Support team: {openTickets} open tickets</span>
          <span>Commerce: {orders.data.length} total orders</span>
          <span>Member services: {services.data.length} active requests</span>
        </CardContent>
      </Card>
    </div>
  );
};

const OverviewPage = async () => (
  <Suspense>
    {/* @ts-expect-error Async Server Component */}
    <SummaryCards />
  </Suspense>
);

export default OverviewPage;

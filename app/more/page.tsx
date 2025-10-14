import { buildRouteMetadata } from "@/app/_lib/navigation";
import { MoreDashboard } from "@/app/_components/more/MoreDashboard";
import {
  fundraiser as mockFundraiser,
  membership as mockMembership,
  profile as mockProfile,
  quickTiles as mockQuickTiles,
  settings as mockSettings,
  upcomingEvent as mockUpcomingEvent,
  wallet as mockWallet,
} from "@/app/_data/more";

export const metadata = buildRouteMetadata("/more");

const MorePage = () => (
  <MoreDashboard
    profile={mockProfile}
    wallet={mockWallet}
    membership={mockMembership}
    fundraiser={mockFundraiser}
    event={mockUpcomingEvent}
    quickTiles={mockQuickTiles}
    settings={mockSettings}
  />
);

export default MorePage;

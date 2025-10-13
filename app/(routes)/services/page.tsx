import { buildRouteMetadata } from "@/app/_lib/navigation";
import PartnerServicesView from "@/views/PartnerServicesView";

export const metadata = buildRouteMetadata("/services", {
  title: "Partner Services — Rayon Sports",
  description: "Buy motor insurance, grow SACCO savings, and unlock fan perks without leaving the Rayon app.",
});

const PartnerServicesPage = () => <PartnerServicesView />;

export default PartnerServicesPage;

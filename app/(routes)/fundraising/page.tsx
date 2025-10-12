import { buildRouteMetadata } from "@/app/_lib/navigation";
import FundraisingView from "@/views/FundraisingView";

export const metadata = buildRouteMetadata("/fundraising");

const FundraisingPage = () => <FundraisingView />;

export default FundraisingPage;

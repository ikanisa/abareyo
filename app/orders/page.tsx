import { buildRouteMetadata } from "@/app/_lib/navigation";
import OrdersClient from "./OrdersClient";

export const metadata = buildRouteMetadata("/orders");

const OrdersPage = () => <OrdersClient />;

export default OrdersPage;

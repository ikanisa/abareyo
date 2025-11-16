import DataTable from "@/components/admin/DataTable";
import EmptyState from "@/app/_components/ui/EmptyState";

const rows = [
  { orderId: "RS-1940", customer: "Nadine", value: "65,000 RWF", state: "Packing" },
  { orderId: "RS-1939", customer: "Theo", value: "18,000 RWF", state: "Delivered" },
];

const columns = [
  { key: "orderId", label: "Order" },
  { key: "customer", label: "Customer" },
  { key: "value", label: "Value" },
  { key: "state", label: "State" },
] as const;

type ShopOrderRow = (typeof rows)[number];

const ShopOrdersManageTable = () => (
  <DataTable<ShopOrderRow>
    title="Shop orders"
    description="Minimal state of fulfillment."
    rows={rows}
    columns={columns}
    emptyState={<EmptyState title="No shop orders" description="Orders will land here when they arrive." />}
  />
);

export default ShopOrdersManageTable;

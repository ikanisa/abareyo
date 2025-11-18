import DataTable from "@/components/admin/DataTable";
import EmptyState from "@/app/_components/ui/EmptyState";

const rows = [
  { purchaser: "Gloria", event: "APR vs Rayon", total: "45,000 RWF", status: "Paid" },
  { purchaser: "Kareem", event: "APR vs Rayon", total: "30,000 RWF", status: "Refunded" },
];

const columns = [
  { key: "purchaser", label: "Purchaser" },
  { key: "event", label: "Event" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
] as const;

type OrderRow = (typeof rows)[number];

const TicketOrdersTable = () => (
  <DataTable<OrderRow>
    title="Ticket orders"
    description="Compact order list without extra chrome."
    rows={rows}
    columns={columns}
    emptyState={<EmptyState title="No orders" description="Orders will appear here once processed." />}
  />
);

export default TicketOrdersTable;

import DataTable from "@/components/admin/DataTable";
import EmptyState from "@/app/_components/ui/EmptyState";

const rows = [
  { member: "Sifa Uwimana", plan: "GIKUNDIRO+ Silver", status: "Active", renews: "Sep 02" },
  { member: "Eric Mugabo", plan: "Supporter", status: "Lapsed", renews: "—" },
];

const columns = [
  { key: "member", label: "Member" },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Status" },
  { key: "renews", label: "Renews" },
] as const;

type MemberRow = (typeof rows)[number];

const MembersTable = () => (
  <DataTable<MemberRow>
    title="Members"
    description="Lean snapshot of current memberships."
    rows={rows}
    columns={columns}
    emptyState={<EmptyState title="No members" description="No active members yet in minimal mode." />}
  />
);

export default MembersTable;

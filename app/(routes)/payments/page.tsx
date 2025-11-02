import PaymentsClient from "./PaymentsClient";
import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/payments", {
  title: "Mobile money payments",
  description: "Review recent mobile money transactions and manage SMS detection permissions.",
});

export default function PaymentsPage() {
  return <PaymentsClient />;
}

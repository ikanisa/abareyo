import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";

import ExternalLauncher from "../_components/ExternalLauncher";

const WHATSAPP_URL = "https://wa.me/22893002751?text=home";

export const metadata = buildRouteMetadata("/services/insurance", {
  title: "Motor insurance partner",
  description: "Launch a WhatsApp conversation with Rayon Sports' trusted insurance provider.",
});

export default function InsuranceRedirectPage() {
  return (
    <PageShell>
      <SubpageHeader
        title="Motor Insurance"
        eyebrow="Partner service"
        description="Chat with our trusted insurance partner to secure your matchday protection."
        backHref="/services"
      />
      <ExternalLauncher
        href={WHATSAPP_URL}
        title="Open WhatsApp"
        description="We are redirecting you to chat with our insurance partner."
        actionLabel="Continue to WhatsApp"
      />
    </PageShell>
  );
}

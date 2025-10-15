import PageShell from "@/app/_components/shell/PageShell";

import ExternalLauncher from "../_components/ExternalLauncher";

const WHATSAPP_URL = "https://wa.me/22893002751?text=home";

export default function InsuranceRedirectPage() {
  return (
    <PageShell>
      <ExternalLauncher
        href={WHATSAPP_URL}
        title="Open WhatsApp"
        description="We are redirecting you to chat with our insurance partner."
        actionLabel="Continue to WhatsApp"
      />
    </PageShell>
  );
}

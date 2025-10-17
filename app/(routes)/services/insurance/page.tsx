import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";

import ExternalLauncher from "../_components/ExternalLauncher";

const WHATSAPP_URL = "https://wa.me/22893002751?text=home";

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

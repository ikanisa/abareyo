import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";

import ExternalLauncher from "../_components/ExternalLauncher";

const USSD_CODE = "tel:*182*1*1*0788767816%23";

export default function SavingsRedirectPage() {
  return (
    <PageShell>
      <SubpageHeader
        title="Savings Streak"
        eyebrow="Partner service"
        description="Launch the SACCO USSD flow to keep your savings streak alive."
        backHref="/services"
      />
      <ExternalLauncher
        href={USSD_CODE}
        title="Dial USSD"
        description="We are launching the savings USSD code on your device."
        actionLabel="Dial *182*1*1*0788767816#"
      />
    </PageShell>
  );
}

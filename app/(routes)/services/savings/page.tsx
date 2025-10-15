import PageShell from "@/app/_components/shell/PageShell";

import ExternalLauncher from "../_components/ExternalLauncher";

const USSD_CODE = "tel:*182*1*1*0788767816%23";

export default function SavingsRedirectPage() {
  return (
    <PageShell>
      <ExternalLauncher
        href={USSD_CODE}
        title="Dial USSD"
        description="We are launching the savings USSD code on your device."
        actionLabel="Dial *182*1*1*0788767816#"
      />
    </PageShell>
  );
}

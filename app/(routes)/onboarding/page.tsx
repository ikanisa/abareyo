import OnboardingWizardClient from "./OnboardingWizardClient";
import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/onboarding", {
  title: "Set up your Rayon Sports profile",
  description: "Verify your contact details and preferences to unlock the full fan experience.",
});

export default function OnboardingPage() {
  return <OnboardingWizardClient />;
}

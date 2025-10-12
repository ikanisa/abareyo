import { redirect } from "next/navigation";

export default function OnboardingRedirect(){
  // Onboarding route is deprecated; send users to Home with the modal open.
  redirect('/?onboarding=1');
}

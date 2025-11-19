import { buildRouteMetadata } from "@/app/_lib/navigation";
import ResetPasswordView from "@/views/ResetPasswordView";

export const metadata = buildRouteMetadata("/auth/reset", {
  title: "Reset password",
  description: "Request a Supabase password reset link by email.",
});

const ResetPasswordPage = () => <ResetPasswordView />;

export default ResetPasswordPage;

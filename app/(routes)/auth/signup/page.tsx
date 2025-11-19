import { buildRouteMetadata } from "@/app/_lib/navigation";
import SignupView from "@/views/SignupView";

export const metadata = buildRouteMetadata("/auth/signup", {
  title: "Create Account",
  description: "Create your supporter account with email and password or request a magic link.",
});

const SignupPage = () => <SignupView />;

export default SignupPage;

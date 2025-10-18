import { buildRouteMetadata } from "@/app/_lib/navigation";
import LoginView from "@/views/LoginView";

export const metadata = buildRouteMetadata("/auth/login", {
  title: "Fan Login",
  description: "Sign in with your supporter email to access wallet, tickets, and rewards.",
});

const FanLoginPage = () => <LoginView />;

export default FanLoginPage;

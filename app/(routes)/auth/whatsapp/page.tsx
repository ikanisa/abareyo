import { buildRouteMetadata } from "@/app/_lib/navigation";

import WhatsAppLoginClient from "./WhatsAppLoginClient";

export const metadata = buildRouteMetadata("/auth/whatsapp", {
  title: "WhatsApp Login",
  description: "Verify your WhatsApp number to unlock fan membership features.",
});

const WhatsAppAuthPage = () => <WhatsAppLoginClient />;

export default WhatsAppAuthPage;

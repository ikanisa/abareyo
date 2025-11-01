"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { dispatchTelemetryEvent } from "@/lib/observability";
import { useAuth } from "@/providers/auth-provider";

import OtpVerificationForm from "./components/OtpVerificationForm";
import PhoneEntryForm from "./components/PhoneEntryForm";

type RequestContext = {
  phone: string;
  requestId: string;
  resendAfter: number;
};

const WhatsAppLoginClient = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { completeWhatsappLogin } = useAuth();
  const [requestContext, setRequestContext] = useState<RequestContext | null>(null);

  const handleReset = () => {
    if (requestContext) {
      void dispatchTelemetryEvent({
        type: "whatsapp_auth_reset",
        phone: requestContext.phone,
        requestId: requestContext.requestId,
      });
    }
    setRequestContext(null);
  };

  const handleRequestIssued = (context: RequestContext) => {
    setRequestContext(context);
  };

  const handleVerificationSuccess = async (
    payload: { accessToken: string; refreshToken?: string | null; userId: string },
  ) => {
    try {
      await completeWhatsappLogin({ accessToken: payload.accessToken, refreshToken: payload.refreshToken });
      toast({
        title: "WhatsApp verified",
        description: "You're signed in and can access member features.",
      });
      void dispatchTelemetryEvent({
        type: "whatsapp_auth_verified",
        phone: requestContext?.phone ?? null,
        userId: payload.userId,
      });
      router.replace("/onboarding");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to finish login.";
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
      void dispatchTelemetryEvent({
        type: "whatsapp_auth_finalize_failed",
        phone: requestContext?.phone ?? null,
        error: message,
      });
    }
  };

  const heroActions = (
    <Link className="btn" href="/">
      Home
    </Link>
  );

  return (
    <PageShell mainClassName="pb-24">
      <TopAppBar right={heroActions} />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">WhatsApp Login</h1>
            <p className="text-sm text-muted-foreground">
              Verify your supporter number via WhatsApp to unlock wallet, tickets, and membership perks.
            </p>
          </div>
        </div>

        <Card className="border border-primary/20 bg-white/5 text-foreground backdrop-blur">
          <CardHeader>
            <CardTitle>{requestContext ? "Enter your one-time code" : "Add your WhatsApp number"}</CardTitle>
            <CardDescription>
              {requestContext
                ? "We sent a 6-digit code to your WhatsApp. Enter it below to confirm your identity."
                : "We'll text you a secure link on WhatsApp. Standard data charges may apply."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {requestContext ? (
              <OtpVerificationForm
                key={requestContext.requestId}
                requestId={requestContext.requestId}
                phone={requestContext.phone}
                initialCountdown={requestContext.resendAfter}
                onBack={handleReset}
                onVerified={handleVerificationSuccess}
              />
            ) : (
              <PhoneEntryForm onSuccess={handleRequestIssued} />
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 text-xs text-muted-foreground">
            <Separator />
            <p className="text-center">
              By continuing you agree to receive security notifications on WhatsApp for your Rayon Nation account.
            </p>
          </CardFooter>
        </Card>
      </div>
    </PageShell>
  );
};

export default WhatsAppLoginClient;

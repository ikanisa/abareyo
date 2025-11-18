"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/components/ui/use-toast";
import { resendWhatsappOtp, verifyWhatsappOtp } from "@/lib/api/whatsapp-auth";
import { dispatchTelemetryEvent } from "@/lib/observability";

const schema = z.object({
  code: z
    .string({ required_error: "Enter the 6-digit code" })
    .regex(/^\d{6}$/i, "Enter the 6-digit code"),
});

type FormValues = z.infer<typeof schema>;

type OtpVerificationFormProps = {
  requestId: string;
  phone: string;
  initialCountdown: number;
  onBack: () => void;
  onVerified: (payload: { accessToken: string; refreshToken?: string | null; userId: string }) => void;
  onSmsFallback?: (phone?: string) => void;
};

const OtpVerificationForm = ({
  requestId,
  phone,
  initialCountdown,
  onBack,
  onVerified,
}: OtpVerificationFormProps) => {
  const { toast } = useToast();
  const [resendCountdown, setResendCountdown] = useState(initialCountdown);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    setResendCountdown(initialCountdown);
  }, [initialCountdown]);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  const verifyMutation = useMutation({
    mutationFn: async ({ code }: FormValues) => {
      await dispatchTelemetryEvent({ type: "whatsapp_auth_verify_attempt", requestId, phone });
      const result = await verifyWhatsappOtp({ requestId, code });
      return result;
    },
    onSuccess: (result) => {
      void dispatchTelemetryEvent({ type: "whatsapp_auth_verify_success", requestId, phone });
      void dispatchTelemetryEvent({ type: "whatsapp_auth_step_completed", step: "otp_verified", requestId, phone });
      onVerified(result);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Invalid code. Try again.";
      toast({
        title: "Verification failed",
        description: message,
        variant: "destructive",
      });
      void dispatchTelemetryEvent({ type: "whatsapp_auth_verify_failed", requestId, phone, error: message });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      setRetryMessage(null);
      await dispatchTelemetryEvent({ type: "whatsapp_auth_retry", requestId, phone });
      await dispatchTelemetryEvent({ type: "whatsapp_auth_resend_attempt", requestId, phone });
      const response = await resendWhatsappOtp({ requestId });
      return response;
    },
    onSuccess: (data) => {
      setResendCountdown(data.resendAfter);
      setRetryMessage(`New code sent. You can request another in ${data.resendAfter}s if needed.`);
      toast({ title: "Code re-sent", description: "Check your WhatsApp for a new code." });
      void dispatchTelemetryEvent({ type: "whatsapp_auth_resend_success", requestId, phone });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to resend code.";
      const detail = (() => {
        if (error instanceof Error) {
          try {
            return JSON.parse(error.message) as { error?: string; resendAfter?: number };
          } catch (_error) {
            return null;
          }
        }
        return null;
      })();

      const inlineMessage =
        detail?.error === "resend_not_ready" && typeof detail?.resendAfter === "number"
          ? `Please wait ${detail.resendAfter}s before requesting another code.`
          : message;

      setRetryMessage(inlineMessage);
      toast({ title: "Could not resend", description: inlineMessage, variant: "destructive" });
      void dispatchTelemetryEvent({ type: "whatsapp_auth_resend_failed", requestId, phone, error: message });
    },
  });

  const formattedPhone = useMemo(() => phone.replace(/(\d{3})(?=\d)/g, "$1 "), [phone]);

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
        We sent a one-time code to <span className="font-medium text-foreground">{formattedPhone}</span>. Codes expire after a
        few minutes.
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => verifyMutation.mutate(values))}
          className="space-y-5"
          aria-label="Verify WhatsApp code"
        >
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>6-digit code</FormLabel>
                <FormControl>
                  <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={`otp-slot-${index}`} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormDescription>Only digits are allowed. The code expires quickly.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? "Verifying…" : "Verify and continue"}
          </Button>
        </form>
      </Form>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => resendMutation.mutate()}
          disabled={resendCountdown > 0 || resendMutation.isPending}
        >
          {resendMutation.isPending
            ? "Sending…"
            : resendCountdown > 0
              ? `Resend in ${resendCountdown}s`
              : "Resend code"}
        </Button>

        <Button type="button" variant="link" size="sm" onClick={onBack} className="text-xs">
          Use a different number
        </Button>
      </div>

      {retryMessage ? (
        <Alert className="bg-muted/60 text-foreground">
          <AlertTitle className="text-sm font-semibold">Retry status</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">{retryMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 text-xs text-muted-foreground">
        <p className="leading-tight">Having trouble? Confirm WhatsApp notifications are enabled and try again.</p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={verifyMutation.isPending}
            onClick={() => {
              void dispatchTelemetryEvent({ type: "whatsapp_auth_sms_fallback_requested", phone });
              onSmsFallback?.(phone);
            }}
          >
            Send SMS instead
          </Button>
          <span className="self-center text-[11px] text-muted-foreground/80">
            SMS fallback is slower but works on basic devices.
          </span>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationForm;

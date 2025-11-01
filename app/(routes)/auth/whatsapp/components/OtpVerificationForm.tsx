"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
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
      await dispatchTelemetryEvent({ type: "whatsapp_auth_resend_attempt", requestId, phone });
      const response = await resendWhatsappOtp({ requestId });
      return response;
    },
    onSuccess: (data) => {
      setResendCountdown(data.resendAfter);
      toast({ title: "Code re-sent", description: "Check your WhatsApp for a new code." });
      void dispatchTelemetryEvent({ type: "whatsapp_auth_resend_success", requestId, phone });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to resend code.";
      toast({ title: "Could not resend", description: message, variant: "destructive" });
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
    </div>
  );
};

export default OtpVerificationForm;

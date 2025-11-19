"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { startWhatsappAuth } from "@/lib/api/whatsapp-auth";
import { dispatchTelemetryEvent } from "@/lib/observability";

const schema = z.object({
  phone: z
    .string({ required_error: "Enter your WhatsApp number" })
    .trim()
    .min(9, "Enter a valid WhatsApp number")
    .regex(/^[+0-9\s()-]+$/, "Only digits and + are allowed"),
});

type FormValues = z.infer<typeof schema>;

type PhoneEntryFormProps = {
  onSuccess: (context: { phone: string; requestId: string; resendAfter: number }) => void;
  onSmsFallback?: (phone?: string) => void;
};

const normalisePhone = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+")) {
    return `+${digits.replace(/^\++/, "")}`;
  }
  return `+${digits.replace(/^\++/, "")}`;
};

const formatRetryWindow = (retryAt: string) => {
  const retryDate = new Date(retryAt);
  const seconds = Math.max(0, Math.round((retryDate.getTime() - Date.now()) / 1000));
  const minutes = Math.ceil(seconds / 60);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours}h`;
};

const parseErrorPayload = (error: unknown) => {
  if (error instanceof Error) {
    try {
      return JSON.parse(error.message) as Record<string, unknown>;
    } catch (_error) {
      return null;
    }
  }

  return null;
};

const PhoneEntryForm = ({ onSuccess, onSmsFallback }: PhoneEntryFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const { toast } = useToast();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showSmsFallback, setShowSmsFallback] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ phone }: FormValues) => {
      const formatted = normalisePhone(phone);
      await dispatchTelemetryEvent({ type: "whatsapp_auth_start_requested", phone: formatted });
      const result = await startWhatsappAuth({ phone: formatted });
      return { ...result, phone: formatted };
    },
    onSuccess: (result) => {
      setStatusMessage("WhatsApp code sent. Keep this tab open to enter it here.");
      setShowSmsFallback(false);
      void dispatchTelemetryEvent({
        type: "whatsapp_auth_code_sent",
        phone: result.phone,
        requestId: result.requestId,
      });
      void dispatchTelemetryEvent({
        type: "whatsapp_auth_step_completed",
        step: "phone_submitted",
        phone: result.phone,
        requestId: result.requestId,
      });
      onSuccess({ phone: result.phone, requestId: result.requestId, resendAfter: result.resendAfter });
    },
    onError: (error: unknown) => {
      const payload = parseErrorPayload(error);
      const retryIn = payload?.retryAt && typeof payload.retryAt === "string" ? formatRetryWindow(payload.retryAt) : null;
      const errorCode = payload?.error && typeof payload.error === "string" ? payload.error : null;
      const message =
        retryIn
          ? `Too many attempts. Try again in ${retryIn}.`
          : errorCode === "invalid_phone"
            ? "That number looks invalid. Use the full international format."
            : "We couldn't send the code. Try again or request SMS instead.";
      setStatusMessage(message);
      setShowSmsFallback(true);
      toast({
        title: "Code not sent",
        description: message,
        variant: "destructive",
      });
      void dispatchTelemetryEvent({ type: "whatsapp_auth_start_failed", error: message });
    },
  });

  const handleSubmit = useCallback(
    (values: FormValues) => {
      mutation.mutate(values);
    },
    [mutation],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+2507xxxxxxx"
                  aria-label="WhatsApp phone number"
                />
              </FormControl>
              <FormDescription>Enter the number connected to WhatsApp. We’ll text your code there.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Sending code…" : "Send WhatsApp code"}
        </Button>

        {statusMessage ? (
          <Alert className="bg-muted/60 text-foreground">
            <AlertTitle className="text-sm font-semibold">{showSmsFallback ? "Delivery issue" : "Status"}</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">{statusMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <p className="leading-tight">Standard data charges may apply. Codes expire after a few minutes.</p>
          {showSmsFallback ? (
            <div className="flex flex-col gap-2">
              <p className="leading-tight">WhatsApp isn’t responding? Request SMS delivery instead.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => {
                  void dispatchTelemetryEvent({ type: "whatsapp_auth_sms_fallback_requested", phone: form.getValues("phone") });
                  onSmsFallback?.(form.getValues("phone"));
                }}
              >
                Send SMS code
              </Button>
            </div>
          ) : null}
        </div>
      </form>
    </Form>
  );
};

export default PhoneEntryForm;

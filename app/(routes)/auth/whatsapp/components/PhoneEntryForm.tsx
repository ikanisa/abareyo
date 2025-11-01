"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

const PhoneEntryForm = ({ onSuccess }: PhoneEntryFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
  });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ phone }: FormValues) => {
      const formatted = normalisePhone(phone);
      await dispatchTelemetryEvent({ type: "whatsapp_auth_start_requested", phone: formatted });
      const result = await startWhatsappAuth({ phone: formatted });
      return { ...result, phone: formatted };
    },
    onSuccess: (result) => {
      void dispatchTelemetryEvent({
        type: "whatsapp_auth_code_sent",
        phone: result.phone,
        requestId: result.requestId,
      });
      onSuccess({ phone: result.phone, requestId: result.requestId, resendAfter: result.resendAfter });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "We couldn't send the code. Try again.";
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
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Sending code…" : "Send WhatsApp code"}
        </Button>
      </form>
    </Form>
  );
};

export default PhoneEntryForm;

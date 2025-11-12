"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/ui/use-toast";

type ToastContent = {
  title: string;
  description?: string;
};

type AdminMutationState = {
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  activeId?: string;
};

type AdminMutationOptions<TInput, TResult> = {
  mutationFn: (input: TInput) => Promise<TResult>;
  getEntityId?: (input: TInput) => string | number | null | undefined;
  onMutate?: (input: TInput) => void | (() => void);
  onSuccess?: (result: TResult, input: TInput) => void;
  onError?: (error: unknown, input: TInput) => void;
  successToast?: ToastContent;
  errorToast?: Partial<ToastContent>;
  transformError?: (error: unknown) => string | Partial<ToastContent> | null | undefined;
};

type UseAdminMutationResult<TInput, TResult> = {
  state: AdminMutationState;
  execute: (input: TInput) => Promise<TResult>;
  reset: () => void;
};

const parseError = (
  error: unknown,
  transform?: (error: unknown) => string | Partial<ToastContent> | null | undefined,
): { message: string; toast?: Partial<ToastContent> } => {
  const fallbackMessage = error instanceof Error ? error.message : "Unexpected error";
  if (!transform) {
    return { message: fallbackMessage };
  }
  const transformed = transform(error);
  if (!transformed) {
    return { message: fallbackMessage };
  }
  if (typeof transformed === "string") {
    return { message: transformed };
  }
  const message = transformed.description ?? transformed.title ?? fallbackMessage;
  return { message, toast: transformed };
};

export const useAdminMutation = <TInput, TResult = void>({
  mutationFn,
  getEntityId,
  onMutate,
  onSuccess,
  onError,
  successToast,
  errorToast,
  transformError,
}: AdminMutationOptions<TInput, TResult>): UseAdminMutationResult<TInput, TResult> => {
  const { toast } = useToast();
  const [state, setState] = useState<AdminMutationState>({ status: "idle", error: null });

  const reset = useCallback(() => {
    setState({ status: "idle", error: null });
  }, []);

  const execute = useCallback(
    async (input: TInput) => {
      const entityId = getEntityId?.(input);
      setState({ status: "loading", error: null, activeId: entityId != null ? String(entityId) : undefined });
      let rollback: void | (() => void);
      try {
        rollback = onMutate?.(input);
        const result = await mutationFn(input);
        onSuccess?.(result, input);
        if (successToast) {
          toast({ ...successToast });
        }
        setState({ status: "success", error: null });
        return result;
      } catch (error) {
        if (typeof rollback === "function") {
          try {
            rollback();
          } catch (rollbackError) {
            console.warn("Admin mutation rollback failed", rollbackError);
          }
        }
        onError?.(error, input);
        const parsed = parseError(error, transformError);
        const toastPayload: Partial<ToastContent> = {
          title: errorToast?.title ?? "Action failed",
          description: errorToast?.description ?? parsed.message,
        };
        toast({ ...toastPayload, variant: "destructive" });
        setState({ status: "error", error: parsed.message, activeId: entityId != null ? String(entityId) : undefined });
        throw error;
      }
    },
    [
      errorToast?.description,
      errorToast?.title,
      getEntityId,
      mutationFn,
      onError,
      onSuccess,
      onMutate,
      successToast,
      toast,
      transformError,
    ],
  );

  return { state, execute, reset };
};

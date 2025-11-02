"use client";

import { useCallback } from "react";

import type { AuditEvent } from "./types";

export const useAuditLogger = () =>
  useCallback(async (event: AuditEvent) => {
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        console.error("[audit] failed to persist event", await response.text());
      }
    } catch (error) {
      console.error("[audit] request error", error);
    }
  }, []);

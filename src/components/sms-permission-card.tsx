"use client";

import { useEffect } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, AlertCircle } from "lucide-react";

interface SmsPermissionCardProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function SmsPermissionCard({ onPermissionDenied }: SmsPermissionCardProps) {
  useEffect(() => {
    onPermissionDenied?.();
  }, [onPermissionDenied]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Smartphone className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>SMS Payment Detection</CardTitle>
            <CardDescription>
              Automatic SMS parsing requires the legacy Android shell and is not available in the web app.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Copy the USSD confirmation code manually—SMS background access has been retired with the native bridges.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          We continue to reconcile mobile money payments automatically once your confirmation code is submitted. SMS
          ingestion will return alongside a dedicated mobile app in the future roadmap.
        </p>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useSmsReader, isSmsReadingSupported } from '@/lib/capacitor/sms-reader';

interface SmsPermissionCardProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function SmsPermissionCard({
  onPermissionGranted,
  onPermissionDenied,
}: SmsPermissionCardProps) {
  const [permissionStatus, setPermissionStatus] = useState<
    'unknown' | 'granted' | 'denied' | 'checking' | 'requesting'
  >('unknown');
  const [error, setError] = useState<string | null>(null);
  const { isSupported, checkPermission, requestPermission } = useSmsReader();

  useEffect(() => {
    if (!isSupported) {
      setPermissionStatus('denied');
      setError('SMS reading is not supported on this device');
      return;
    }

    checkCurrentPermission();
  }, [isSupported]);

  const checkCurrentPermission = async () => {
    setPermissionStatus('checking');
    setError(null);

    try {
      const result = await checkPermission();
      setPermissionStatus(result.granted ? 'granted' : 'denied');
      
      if (result.granted && onPermissionGranted) {
        onPermissionGranted();
      }
    } catch (err) {
      console.error('Error checking permission:', err);
      setError('Failed to check SMS permission');
      setPermissionStatus('denied');
    }
  };

  const handleRequestPermission = async () => {
    setPermissionStatus('requesting');
    setError(null);

    try {
      const result = await requestPermission();
      setPermissionStatus(result.granted ? 'granted' : 'denied');

      if (result.granted) {
        if (onPermissionGranted) {
          onPermissionGranted();
        }
      } else {
        if (onPermissionDenied) {
          onPermissionDenied();
        }
        setError('Permission was denied. Please enable it in device settings.');
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to request SMS permission');
      setPermissionStatus('denied');
      
      if (onPermissionDenied) {
        onPermissionDenied();
      }
    }
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          SMS reading is not supported on this device. This feature is only available on Android devices.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Smartphone className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>SMS Payment Detection</CardTitle>
            <CardDescription>
              Allow the app to read mobile money payment SMS messages
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We need permission to read SMS messages to automatically detect mobile money
          payments and allocate them to your orders. Your SMS data is processed securely
          and only payment-related messages are used.
        </p>

        {permissionStatus === 'granted' && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              SMS permission granted! Payment messages will be detected automatically.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h4 className="font-medium text-sm">How it works:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>App reads mobile money payment SMS messages</li>
            <li>AI extracts payment amount and reference</li>
            <li>Payment is automatically matched to your pending order</li>
            <li>Your order is confirmed and ticket is generated</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        {(permissionStatus === 'unknown' || permissionStatus === 'denied' || permissionStatus === 'requesting') && (
          <Button
            onClick={handleRequestPermission}
            disabled={permissionStatus === 'requesting'}
            className="w-full"
          >
            {permissionStatus === 'requesting' ? 'Requesting...' : 'Grant SMS Permission'}
          </Button>
        )}
        {permissionStatus === 'checking' && (
          <Button disabled className="w-full">
            Checking permission...
          </Button>
        )}
        {permissionStatus === 'granted' && (
          <Button onClick={checkCurrentPermission} variant="outline" className="w-full">
            Recheck Permission
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

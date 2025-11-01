/**
 * SMS Reader Plugin for Capacitor
 * Provides Android SMS reading capabilities for mobile money payment notifications
 */

import { Capacitor } from '@capacitor/core';

export interface SmsMessage {
  id: string;
  address: string; // Sender phone number
  body: string; // SMS text content
  date: number; // Timestamp in milliseconds
  read: boolean;
}

export interface SmsReaderPlugin {
  /**
   * Request SMS read permission from the user
   * @returns Promise resolving to permission status
   */
  requestPermission(): Promise<{ granted: boolean }>;

  /**
   * Check if SMS read permission is granted
   * @returns Promise resolving to permission status
   */
  checkPermission(): Promise<{ granted: boolean }>;

  /**
   * Read SMS messages from inbox
   * @param options Filter options for SMS reading
   * @returns Promise resolving to array of SMS messages
   */
  readSms(options?: {
    maxCount?: number;
    address?: string; // Filter by sender
    minDate?: number; // Unix timestamp in milliseconds
  }): Promise<{ messages: SmsMessage[] }>;

  /**
   * Start listening for incoming SMS messages
   * @param callback Function to call when SMS is received
   */
  startListening(
    callback: (message: SmsMessage) => void
  ): Promise<{ listening: boolean }>;

  /**
   * Stop listening for incoming SMS messages
   */
  stopListening(): Promise<{ stopped: boolean }>;
}

class SmsReaderWeb implements SmsReaderPlugin {
  async requestPermission(): Promise<{ granted: boolean }> {
    console.warn('SMS reading is not available on web platform');
    return { granted: false };
  }

  async checkPermission(): Promise<{ granted: boolean }> {
    return { granted: false };
  }

  async readSms(): Promise<{ messages: SmsMessage[] }> {
    console.warn('SMS reading is not available on web platform');
    return { messages: [] };
  }

  async startListening(): Promise<{ listening: boolean }> {
    console.warn('SMS listening is not available on web platform');
    return { listening: false };
  }

  async stopListening(): Promise<{ stopped: boolean }> {
    return { stopped: true };
  }
}

/**
 * SmsReader instance - uses native implementation on Android, web fallback otherwise
 */
export const SmsReader: SmsReaderPlugin = Capacitor.isNativePlatform()
  ? (Capacitor as any).Plugins.SmsReader || new SmsReaderWeb()
  : new SmsReaderWeb();

/**
 * Check if SMS reading is supported on the current platform
 */
export function isSmsReadingSupported(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Hook for React components to use SMS reader functionality
 */
export function useSmsReader() {
  const isSupported = isSmsReadingSupported();

  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error('SMS reading not supported on this platform');
    }
    return await SmsReader.requestPermission();
  };

  const checkPermission = async () => {
    if (!isSupported) return { granted: false };
    return await SmsReader.checkPermission();
  };

  const readSms = async (options?: Parameters<SmsReaderPlugin['readSms']>[0]) => {
    if (!isSupported) {
      throw new Error('SMS reading not supported on this platform');
    }
    return await SmsReader.readSms(options);
  };

  return {
    isSupported,
    requestPermission,
    checkPermission,
    readSms,
    startListening: SmsReader.startListening.bind(SmsReader),
    stopListening: SmsReader.stopListening.bind(SmsReader),
  };
}

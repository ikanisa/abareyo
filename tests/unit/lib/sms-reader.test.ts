import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSmsReadingSupported } from '@/lib/capacitor/sms-reader';
import type { Capacitor as CapacitorType } from '@capacitor/core';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(),
    isNativePlatform: vi.fn(),
    Plugins: {},
  },
}));

describe('SMS Reader', () => {
  let Capacitor: typeof CapacitorType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const capacitorModule = await import('@capacitor/core');
    Capacitor = capacitorModule.Capacitor;
  });

  describe('isSmsReadingSupported', () => {
    it('should return true on Android platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      
      const result = isSmsReadingSupported();
      expect(result).toBe(true);
    });

    it('should return false on iOS platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      
      const result = isSmsReadingSupported();
      expect(result).toBe(false);
    });

    it('should return false on web platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      
      const result = isSmsReadingSupported();
      expect(result).toBe(false);
    });
  });
});

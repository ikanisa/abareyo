import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSmsReadingSupported } from '@/lib/capacitor/sms-reader';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(),
    isNativePlatform: vi.fn(),
    Plugins: {},
  },
}));

describe('SMS Reader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSmsReadingSupported', () => {
    it('should return true on Android platform', async () => {
      const { Capacitor } = await import('@capacitor/core');
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      
      const result = isSmsReadingSupported();
      expect(result).toBe(true);
    });

    it('should return false on iOS platform', async () => {
      const { Capacitor } = await import('@capacitor/core');
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      
      const result = isSmsReadingSupported();
      expect(result).toBe(false);
    });

    it('should return false on web platform', async () => {
      const { Capacitor } = await import('@capacitor/core');
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      
      const result = isSmsReadingSupported();
      expect(result).toBe(false);
    });
  });
});

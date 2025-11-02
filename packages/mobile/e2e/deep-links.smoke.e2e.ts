import { by, device, element, expect } from 'detox';

describe('Deep linking', () => {
  it('opens match detail from custom scheme', async () => {
    await device.launchApp({ delete: true, newInstance: true, url: 'gikundiro://matches/apr-derby' });
    await expect(element(by.id('screen-match-detail'))).toBeVisible();
  });

  it('opens shop detail from universal link', async () => {
    await device.launchApp({
      newInstance: true,
      url: 'https://gikundiro.com/shop/home-kit',
    });
    await expect(element(by.id('screen-shop-detail'))).toBeVisible();
  });
});

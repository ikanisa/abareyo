import { by, device, element, expect } from 'detox';

describe('Tab navigation smoke', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  const tabs: Array<{ tab: string; screen: string }> = [
    { tab: 'tab-home', screen: 'screen-home' },
    { tab: 'tab-matches', screen: 'screen-matches' },
    { tab: 'tab-tickets', screen: 'screen-tickets' },
    { tab: 'tab-shop', screen: 'screen-shop' },
    { tab: 'tab-more', screen: 'screen-more' },
  ];

  it('renders all primary screens', async () => {
    for (const { tab, screen } of tabs) {
      await element(by.id(tab)).tap();
      await expect(element(by.id(screen))).toBeVisible();
    }
  });
});

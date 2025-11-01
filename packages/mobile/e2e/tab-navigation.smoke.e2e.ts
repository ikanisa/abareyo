import { device, element, by, expect } from 'detox';

describe('Mobile tab navigation smoke', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  const tabs: Array<{ id: string; screenId: string; label: string }> = [
    { id: 'tab-home', screenId: 'screen-home', label: 'Home' },
    { id: 'tab-services', screenId: 'screen-services', label: 'Services' },
    { id: 'tab-community', screenId: 'screen-community', label: 'Community' },
    { id: 'tab-account', screenId: 'screen-account', label: 'Account' },
  ];

  it('switches between the core tabs without regression', async () => {
    for (const tab of tabs) {
      const trigger = element(by.id(tab.id));
      await expect(trigger).toBeVisible();
      await trigger.tap();
      await expect(element(by.id(tab.screenId))).toBeVisible();
      await expect(element(by.text(tab.label))).toBeVisible();
    }
  });
});

describe('USSD CTA smoke', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  const ctas: Array<{ id: string; shortcode: string }> = [
    { id: 'cta-buy-tickets', shortcode: '*182*8*1#' },
    { id: 'cta-join-membership', shortcode: '*182*7*1#' },
    { id: 'cta-open-sacco', shortcode: '*182*1*1#' },
  ];

  it('renders dialable USSD shortcuts for the primary CTAs', async () => {
    await expect(element(by.id('screen-home'))).toBeVisible();

    for (const cta of ctas) {
      const button = element(by.id(cta.id));
      await expect(button).toBeVisible();
      await expect(element(by.text(cta.shortcode))).toBeVisible();
    }
  });
});

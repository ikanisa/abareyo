import { by, device, element, expect } from 'detox';

describe('USSD CTA parity', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('shows dial and copy actions', async () => {
    await expect(element(by.id('screen-home'))).toBeVisible();
    await expect(element(by.id('cta-qa-membership'))).toBeVisible();
    await expect(element(by.id('copy-qa-membership'))).toBeVisible();
    await expect(element(by.id('cta-qa-sacco'))).toBeVisible();
    await expect(element(by.id('copy-qa-sacco'))).toBeVisible();
  });

  it('exposes ticket purchase USSD fallback', async () => {
    await element(by.id('tab-tickets')).tap();
    await expect(element(by.id('screen-tickets'))).toBeVisible();
    await expect(element(by.id('cta-buy-apr-derby'))).toBeVisible();
    await expect(element(by.id('copy-buy-apr-derby'))).toBeVisible();
  });
});

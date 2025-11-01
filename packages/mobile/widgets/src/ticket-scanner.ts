import { MOBILE_REMOTE_CONFIG, MOBILE_WIDGET_TOGGLES } from './feature-toggles';
import type { WidgetModule } from './types';

type TicketScannerConfig = {
  /** Title surfaced in the native shell */
  title: string;
  /** Description displayed beneath the CTA */
  description: string;
  /** Optional CTA label override */
  cta?: string;
};

export const TicketScannerWidget: WidgetModule<TicketScannerConfig> = {
  id: 'ticket-scanner',
  title: 'Ticket QR Scanner',
  featureToggle: MOBILE_WIDGET_TOGGLES.ticketScanner,
  remoteConfig: [MOBILE_REMOTE_CONFIG.ticketScannerRollout],
  config: {
    title: 'Scan Supporter QR',
    description:
      'Align the QR code within the frame. The app will automatically validate entry permissions.',
    cta: 'Launch Scanner',
  },
};

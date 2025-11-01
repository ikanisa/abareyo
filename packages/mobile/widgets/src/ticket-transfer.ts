import { MOBILE_REMOTE_CONFIG, MOBILE_WIDGET_TOGGLES } from './feature-toggles';
import type { WidgetModule } from './types';

type TicketTransferConfig = {
  title: string;
  description: string;
  helpLink?: string;
};

export const TicketTransferWidget: WidgetModule<TicketTransferConfig> = {
  id: 'ticket-transfer',
  title: 'Ticket Transfer Hub',
  featureToggle: MOBILE_WIDGET_TOGGLES.ticketTransfer,
  remoteConfig: [MOBILE_REMOTE_CONFIG.ticketTransferRollout],
  config: {
    title: 'Send or Receive Tickets',
    description: 'Share match access with friends and family while keeping receipts synced to your wallet.',
    helpLink: 'https://support.rayon.app/tickets/transfers',
  },
};

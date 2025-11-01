import { CastingBroadcastWidget } from './casting-broadcast';
import { TicketScannerWidget } from './ticket-scanner';
import { TicketTransferWidget } from './ticket-transfer';
import type { WidgetRegistry } from './types';

export const buildWidgetRegistry = (): WidgetRegistry => {
  const modules = [TicketScannerWidget, TicketTransferWidget, CastingBroadcastWidget];
  return {
    modules,
    byId: new Map(modules.map((module) => [module.id, module])),
  };
};

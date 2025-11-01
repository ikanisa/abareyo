export const MOBILE_WIDGET_TOGGLES = {
  ticketScanner: 'features.ticketScanner' as const,
  ticketTransfer: 'features.ticketTransferV2' as const,
  casting: 'features.streamingCast' as const,
};

export const MOBILE_REMOTE_CONFIG = {
  ticketScannerRollout: 'rollouts.ticketScanner' as const,
  ticketTransferRollout: 'rollouts.ticketTransferV2' as const,
  castingDeviceAllowList: 'widgets.casting.allowedDevices' as const,
};

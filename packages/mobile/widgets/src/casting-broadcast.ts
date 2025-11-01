import { MOBILE_REMOTE_CONFIG, MOBILE_WIDGET_TOGGLES } from './feature-toggles';
import type { WidgetModule } from './types';

type CastingBroadcastConfig = {
  title: string;
  description: string;
  supportedDevicesKey: string;
};

export const CastingBroadcastWidget: WidgetModule<CastingBroadcastConfig> = {
  id: 'casting-broadcast',
  title: 'Casting Broadcast',
  featureToggle: MOBILE_WIDGET_TOGGLES.casting,
  remoteConfig: [MOBILE_REMOTE_CONFIG.castingDeviceAllowList],
  config: {
    title: 'Cast to the Big Screen',
    description: 'Connect to Chromecast or AirPlay enabled devices to watch matches with the crew.',
    supportedDevicesKey: MOBILE_REMOTE_CONFIG.castingDeviceAllowList,
  },
};

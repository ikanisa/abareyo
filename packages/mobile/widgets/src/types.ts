export type RemoteToggleKey = `features.${string}`;

export type RemoteConfigKey =
  | `rollouts.${string}`
  | `widgets.${string}`;

export type WidgetModule<TConfig extends Record<string, unknown> = Record<string, unknown>> = {
  /** Unique identifier used for lookups and analytics */
  id: string;
  /** Human readable label for dashboards */
  title: string;
  /** Remote toggle controlling high-level visibility */
  featureToggle: RemoteToggleKey;
  /** Optional remote config keys used to scope staged rollouts */
  remoteConfig?: RemoteConfigKey[];
  /** Lightweight configuration payload surfaced to the hybrid app */
  config: TConfig;
};

export type WidgetRegistry = {
  modules: WidgetModule[];
  byId: Map<string, WidgetModule>;
};

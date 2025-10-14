export type SecurityHeader = {
  key: string;
  value: string;
};

export declare const buildConnectSources: (env?: NodeJS.ProcessEnv) => string[];
export declare const buildContentSecurityPolicy: (env?: NodeJS.ProcessEnv) => string;
export declare const buildSecurityHeaders: (env?: NodeJS.ProcessEnv) => SecurityHeader[];
export declare const applySecurityHeaders: <T extends { headers: Headers }>(
  response: T,
  env?: NodeJS.ProcessEnv,
) => T;

import { Capacitor, registerPlugin } from "@capacitor/core";

export type ArmTapMoMoOptions = {
  baseUrl: string;
  durationSeconds: number;
  cookie?: string;
  bearerToken?: string;
  initialPayload?: {
    payload: string;
    nonce: string;
    issuedAt: number;
    expiresAt: number;
    signature: string;
  };
};

export type ArmTapMoMoResult = {
  armedUntil: number;
};

export interface TapMoMoPlugin {
  arm(options: ArmTapMoMoOptions): Promise<ArmTapMoMoResult>;
}

const webFallback: TapMoMoPlugin = {
  async arm() {
    console.warn("TapMoMo plugin is unavailable on the web platform.");
    return { armedUntil: Date.now() };
  },
};

export const TapMoMo: TapMoMoPlugin = Capacitor.isNativePlatform()
  ? registerPlugin<TapMoMoPlugin>("TapMoMo")
  : webFallback;

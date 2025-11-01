import { Capacitor } from "@capacitor/core";

const pluginName = "FanApp";

type PluginModule = {
  startReaderMode(): Promise<void>;
  runUssd(options: { code: string; simSlot?: number | null }): Promise<void>;
  getPendingTransactions(): Promise<{ transactions: PendingTransactionResult[] }>;
  markTransactionSynced(options: { transactionId: string }): Promise<void>;
};

export type PendingTransactionResult = {
  transactionId: string;
  payload: string;
  status: string;
  createdAt: string;
};

const getPlugin = async (): Promise<PluginModule | null> => {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  const { registerPlugin } = await import("@capacitor/core");
  return registerPlugin<PluginModule>(pluginName);
};

export const startReaderMode = async () => {
  const plugin = await getPlugin();
  if (!plugin) {
    throw new Error("FanApp plugin unavailable on web");
  }
  await plugin.startReaderMode();
};

export const runUssdRequest = async (code: string, simSlot?: number | null) => {
  const plugin = await getPlugin();
  if (!plugin) {
    throw new Error("FanApp plugin unavailable on web");
  }
  await plugin.runUssd({ code, simSlot });
};

export const loadPendingTransactions = async () => {
  const plugin = await getPlugin();
  if (!plugin) {
    return { transactions: [] };
  }
  return plugin.getPendingTransactions();
};

export const markTransactionSynced = async (transactionId: string) => {
  const plugin = await getPlugin();
  if (!plugin) {
    return;
  }
  await plugin.markTransactionSynced({ transactionId });
};

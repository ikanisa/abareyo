export type ShopProductVariantContract = {
  id: string;
  label: string;
  price: number;
  currency: string;
  stock: number;
  media?: string[];
};

export type ShopProductContract = {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  description?: string | null;
  badge?: string | null;
  price: number;
  currency: string;
  stock: number;
  imageUrl?: string | null;
  media?: string[];
  variants?: ShopProductVariantContract[];
  tags?: string[];
  updatedAt?: string;
};

export type ShopInventoryContract = {
  updatedAt: string;
  products: ShopProductContract[];
};

export type ShopOrderItemContract = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
  variantLabel?: string | null;
};

export type ShopOrderStatusContract =
  | 'pending'
  | 'paid'
  | 'ready'
  | 'pickedup'
  | 'cancelled';

export type ShopOrderContract = {
  id: string;
  userId?: string | null;
  status: ShopOrderStatusContract;
  total: number;
  currency: string;
  momoRef?: string | null;
  createdAt: string;
  items: ShopOrderItemContract[];
};

export type WalletAccountContract = {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
};

export type WalletLedgerDirection = 'credit' | 'debit';

export type WalletLedgerEntryContract = {
  id: string;
  accountId: string;
  direction: WalletLedgerDirection;
  amount: number;
  currency: string;
  description?: string | null;
  occurredAt: string;
  reference?: string | null;
};

export type WalletSnapshotContract = {
  account: WalletAccountContract;
  recentActivity: WalletLedgerEntryContract[];
};

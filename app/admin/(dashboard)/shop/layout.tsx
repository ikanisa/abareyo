import type { ReactNode } from 'react';

import { ShopNav } from './_components/ShopNav';

const AdminShopLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-100">Shop Console</h1>
        <p className="text-sm text-slate-400">Manage product catalog, orders, and promotional campaigns.</p>
      </div>
      <ShopNav />
      <div className="space-y-6">{children}</div>
    </div>
  );
};

export default AdminShopLayout;

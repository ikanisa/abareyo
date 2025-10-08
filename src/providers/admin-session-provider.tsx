'use client';

import { createContext, ReactNode, useContext } from 'react';

type AdminSessionValue = {
  user: {
    id: string;
    email: string;
    displayName: string;
    status: string;
    roles: string[];
  } | null;
  permissions: string[];
};

const AdminSessionContext = createContext<AdminSessionValue | undefined>(undefined);

export const AdminSessionProvider = ({ value, children }: { value: AdminSessionValue; children: ReactNode }) => (
  <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
);

export const useAdminSession = () => {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error('useAdminSession must be used within AdminSessionProvider');
  }
  return context;
};

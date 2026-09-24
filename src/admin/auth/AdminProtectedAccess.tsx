import { createContext, useContext, type ReactElement, type ReactNode } from 'react';

export type AdminProtectedAccess = {
  readonly mutationsAllowed: boolean;
};

type AdminProtectedAccessProviderProps = {
  readonly children: ReactNode;
  readonly mutationsAllowed: boolean;
};

const AdminProtectedAccessContext = createContext<AdminProtectedAccess | null>(null);

export function AdminProtectedAccessProvider({
  children,
  mutationsAllowed,
}: AdminProtectedAccessProviderProps): ReactElement {
  return (
    <AdminProtectedAccessContext.Provider value={{ mutationsAllowed }}>
      {children}
    </AdminProtectedAccessContext.Provider>
  );
}

export function useAdminProtectedAccess(): AdminProtectedAccess {
  const access = useContext(AdminProtectedAccessContext);
  if (access === null) {
    throw new TypeError(
      'useAdminProtectedAccess must be used inside AdminProtectedAccessProvider',
    );
  }
  return access;
}

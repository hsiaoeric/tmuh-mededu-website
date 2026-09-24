import {
  createContext,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  createDraftMediaOwnershipScope,
  type DraftMediaOwnershipScope,
} from './draftMediaOwnership';

type AdminMediaOwnershipProviderProps = {
  readonly children: ReactNode;
};

const AdminMediaOwnershipContext = createContext<DraftMediaOwnershipScope | null>(null);

export function AdminMediaOwnershipProvider({
  children,
}: AdminMediaOwnershipProviderProps): ReactElement {
  const [scope] = useState(createDraftMediaOwnershipScope);
  return (
    <AdminMediaOwnershipContext.Provider value={scope}>
      {children}
    </AdminMediaOwnershipContext.Provider>
  );
}

export function useAdminMediaOwnershipScope(): DraftMediaOwnershipScope {
  const scope = useContext(AdminMediaOwnershipContext);
  if (scope === null) {
    throw new TypeError(
      'useAdminMediaOwnershipScope must be used inside AdminMediaOwnershipProvider',
    );
  }
  return scope;
}

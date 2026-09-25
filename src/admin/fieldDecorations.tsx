import { createContext, useContext, type ReactNode } from 'react';

/** Extra per-field affordances a workspace can switch on without every editor passing them down. */
export type FieldDecorations = {
  /** Whether the field's value differs from the published revision. */
  readonly isChanged?: (fieldId: string) => boolean;
  readonly isZh: boolean;
};

const FieldDecorationsContext = createContext<FieldDecorations | null>(null);

export function FieldDecorationsProvider({ value, children }: { readonly value: FieldDecorations; readonly children: ReactNode }) {
  return <FieldDecorationsContext.Provider value={value}>{children}</FieldDecorationsContext.Provider>;
}

export function useFieldDecorations(): FieldDecorations | null {
  return useContext(FieldDecorationsContext);
}

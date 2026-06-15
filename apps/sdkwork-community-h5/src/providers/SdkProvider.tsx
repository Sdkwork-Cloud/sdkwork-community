import { createContext, useContext, type ReactNode } from 'react';
import { createSdkClients, type SdkClients } from '../bootstrap/sdkClients';

const SdkContext = createContext<SdkClients | null>(null);

interface SdkProviderProps {
  children: ReactNode;
}

export function SdkProvider({ children }: SdkProviderProps) {
  const sdkClients = createSdkClients();
  return (
    <SdkContext.Provider value={sdkClients}>
      {children}
    </SdkContext.Provider>
  );
}

export function useSdk(): SdkClients {
  const sdk = useContext(SdkContext);
  if (!sdk) {
    throw new Error('useSdk must be used within a SdkProvider');
  }
  return sdk;
}
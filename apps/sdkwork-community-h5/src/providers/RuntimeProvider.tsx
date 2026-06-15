import { createContext, useContext, type ReactNode } from 'react';
import { createRuntime, type Runtime } from '../bootstrap/runtime';

const RuntimeContext = createContext<Runtime | null>(null);

interface RuntimeProviderProps {
  children: ReactNode;
}

export function RuntimeProvider({ children }: RuntimeProviderProps) {
  const runtime = createRuntime();
  return (
    <RuntimeContext.Provider value={runtime}>
      {children}
    </RuntimeContext.Provider>
  );
}

export function useRuntime(): Runtime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) {
    throw new Error('useRuntime must be used within a RuntimeProvider');
  }
  return runtime;
}
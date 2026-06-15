import { type ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>SDKWork Community</h1>
      </header>
      <main className="app-content">
        {children}
      </main>
    </div>
  );
}
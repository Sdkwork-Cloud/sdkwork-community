import { type ReactNode } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { COMMUNITY_H5_NAV_ITEMS } from "../routes/communityRoutes";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();

  return (
    <div className="app-shell min-h-screen bg-chat-active-bg flex flex-col">
      <header className="app-header bg-white dark:bg-[#1C1C1E] px-4 py-3 border-b border-black/5 dark:border-white/5 flex items-center gap-6">
        <h1 className="text-[17px] font-bold text-text-main">圈子社区</h1>
        <nav className="flex items-center gap-4">
          {COMMUNITY_H5_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-[14px] transition-colors ${
                  isActive ? "text-blue-500 font-semibold" : "text-text-sub"
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-content flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

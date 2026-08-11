import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { AuthGate } from "./AuthGate";
import { ThemeInitializer } from "./bootstrap/themeInitializer";
import { AppShell } from "./shell/AppShell";
import { communityRouteDefinitions } from "./routes/communityRoutes";

function App() {
  return (
    <BrowserRouter>
      <ThemeInitializer />
      <AuthGate>
        <AppShell>
          <Suspense fallback={<div className="p-8 text-center text-text-sub">加载中...</div>}>
            <Routes>
              {communityRouteDefinitions.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              <Route path="*" element={<div className="p-8 text-center text-text-sub">页面不存在</div>} />
            </Routes>
          </Suspense>
        </AppShell>
      </AuthGate>
    </BrowserRouter>
  );
}

export default App;

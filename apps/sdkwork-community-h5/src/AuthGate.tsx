import { type ReactNode, useEffect, useState } from "react";
import { getRuntime } from "./bootstrap/runtime";

interface AuthGateProps {
  children: ReactNode;
}

/**
 * Renders the application once the IAM runtime finished initializing.
 *
 * The community package works without a session (seeded in-memory port), so
 * the gate only waits for runtime readiness; authenticated data flows through
 * the generated App SDK port configured by `bootstrapCommunityPort`.
 */
export function AuthGate({ children }: AuthGateProps) {
  const [isReady, setIsReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRuntime()
      .initialize()
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setIsReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) {
    return <div className="p-8 text-center text-text-sub">初始化中...</div>;
  }

  if (failed) {
    return <div className="p-8 text-center text-text-sub">运行环境初始化失败</div>;
  }

  return <>{children}</>;
}

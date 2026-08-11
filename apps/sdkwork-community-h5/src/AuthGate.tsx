import { type ReactNode, useEffect, useState } from "react";
import { getRuntime } from "./bootstrap/runtime";

interface AuthGateProps {
  children: ReactNode;
}

/**
 * Renders the application once the IAM runtime finished initializing and a
 * session exists.
 *
 * All community data and entity ids come from the backend service through the
 * generated App SDK port, which is only configured once a session exists
 * (`bootstrapCommunityPort`). Without a session the gate fails closed instead
 * of serving demo data.
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

  if (!getRuntime().getCurrentUser()?.id) {
    return (
      <div className="p-8 text-center text-text-sub">
        请先登录后使用圈子功能
      </div>
    );
  }

  return <>{children}</>;
}

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CashierPage, OrderService } from "@sdkwork/order-mobile-react-orders";
import { CommunityService } from "../services/CommunityService";
import {
  CIRCLE_CASHIER_POLL_INTERVAL_MS,
  isCircleMembershipOrderPaid,
} from "../services/communityOrderRuntime";
import { showToast } from "@sdkwork/ui-mobile-react";

interface CircleCashierBridgeProps {
  orderDetailPath?: string;
  orderCenterPath?: string;
}

/**
 * Circle membership cashier bridge.
 *
 * Renders the official order cashier (`CashierPage` from
 * sdkwork-order-mobile-react-orders) while the bridge polls the order payment
 * status. Once paid, the circle membership is activated through the community
 * App SDK (server-side order verification) and the payer is automatically
 * redirected back to the circle detail page.
 */
export const CircleCashierBridge: React.FC<CircleCashierBridgeProps> = ({
  orderDetailPath,
  orderCenterPath,
}) => {
  const { id: communityId, orderId } = useParams<{ id: string; orderId: string }>();
  const navigate = useNavigate();
  const [tierId, setTierId] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);
  const activatedRef = useRef(false);

  // The cashier deep-link may carry the tier id as a query param so the
  // bridge knows which tier to activate after payment.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tier = params.get("tierId");
    if (tier) {
      setTierId(tier);
    }
  }, []);

  useEffect(() => {
    if (!communityId || !orderId || activatedRef.current) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const activateWhenPaid = async (): Promise<void> => {
      if (cancelled || activatedRef.current) {
        return;
      }
      let paid = false;
      try {
        paid = await isCircleMembershipOrderPaid(orderId);
      } catch {
        return;
      }
      if (!paid || cancelled) {
        return;
      }
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      activatedRef.current = true;
      try {
        if (tierId) {
          await CommunityService.activateMembership(communityId, orderId, tierId);
        }
      } catch (error) {
        // The order is paid; activation failure is surfaced but the payer is
        // still returned to the circle so they can retry activation.
        console.error("circle membership activation failed", error);
        showToast("支付成功，但会员激活未完成，请重新进入圈子重试");
      }
      if (!cancelled) {
        setActivated(true);
        showToast("支付成功，已开通圈子会员");
        navigate(`/community/${communityId}`, { replace: true });
      }
    };

    timer = setInterval(() => {
      void activateWhenPaid();
    }, CIRCLE_CASHIER_POLL_INTERVAL_MS);
    void activateWhenPaid();

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [communityId, orderId, tierId, navigate]);

  if (!communityId || !orderId) {
    return <div className="p-8 text-center text-text-sub">收银台参数缺失</div>;
  }

  return (
    <CashierPage
      orderDetailPath={orderDetailPath}
      orderCenterPath={orderCenterPath}
    />
  );
};

export { OrderService };

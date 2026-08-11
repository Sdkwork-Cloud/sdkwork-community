import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
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
  const { t } = useTranslation();
  const { id: communityId, orderId } = useParams<{ id: string; orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tierId, setTierId] = useState<string | null>(null);
  const activatedRef = useRef(false);

  // The cashier deep-link may carry the tier id as a query param so the
  // bridge knows which tier to activate after payment. Read it through the
  // router so both history and hash routing work (WeChat OAuth returns on a
  // hash route per the order cashier contract).
  useEffect(() => {
    const tier = searchParams.get("tierId");
    if (tier) {
      setTierId(tier);
    }
  }, [searchParams]);

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
      if (!tierId) {
        // Without the tier id the membership cannot be activated; never claim
        // a success. Return to the circle so the payer can retry.
        showToast(t('community.auto_pay_success_missing_tier', '支付成功，但会员激活参数缺失，请重新进入圈子重试'));
        if (!cancelled) {
          navigate(`/community/${communityId}`, { replace: true });
        }
        return;
      }
      try {
        await CommunityService.activateMembership(communityId, orderId, tierId);
      } catch (error) {
        // The order is paid; activation failure is surfaced but the payer is
        // still returned to the circle so they can retry activation.
        console.error("circle membership activation failed", error);
        showToast(t('community.auto_pay_success_activation_failed', '支付成功，但会员激活未完成，请重新进入圈子重试'));
      }
      if (!cancelled) {
        showToast(t('community.auto_pay_success_activated', '支付成功，已开通圈子会员'));
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
    return <div className="p-8 text-center text-text-sub">{t('community.auto_cashier_params_missing', '收银台参数缺失')}</div>;
  }

  return (
    <CashierPage
      orderDetailPath={orderDetailPath}
      orderCenterPath={orderCenterPath}
    />
  );
};

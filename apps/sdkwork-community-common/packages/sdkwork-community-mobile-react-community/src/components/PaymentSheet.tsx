import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { cn, IconButton } from "@sdkwork/ui-mobile-react";
import { MessageSquare, Check, X, Lock } from "lucide-react";
import { getCommunityCurrentUser } from "../services/communityAuthSessionPort";
import { useNavigate, useLocation } from "react-router";
import type { MembershipTier } from "../types";

interface PaymentSheetProps {
  communityName: string;
  communityCoverImage: string;
  tiers: MembershipTier[];
  onClose: () => void;
  onConfirm: (tier: MembershipTier, paymentMethod: string) => void;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  communityName,
  communityCoverImage,
  tiers,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    tiers[0]?.id ?? null,
  );
  // Payment method values follow the sdkwork-order contract (wechat_pay/alipay).
  const [selectedPayment, setSelectedPayment] = useState<'wechat_pay'|'alipay'|null>(null);
  const [isWeChat, setIsWeChat] = useState(false);
  const [isAlipay, setIsAlipay] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 检测是否登录（auth session port 由宿主注入）
    const user = getCommunityCurrentUser();
    if (!user) {
      // 未登录，检测是否在微信内（可支持授权/静默登录Mock）
      const ua = navigator.userAgent.toLowerCase();
      const isWx = ua.includes('micromessenger');

      const currentPath = encodeURIComponent(location.pathname + location.search);
      if (isWx) {
        // Mock 微信授权登录流程
        console.log("检测到微信环境，发起微信授权或静默登录...");
        // 实际开发中会重定向到微信授权URL
      }
      navigate(`/login?redirect=${currentPath}`);
    }
  }, [navigate, location]);

  useEffect(() => {
    // 环境检测：微信/支付宝/网页
    const ua = navigator.userAgent.toLowerCase();
    const isWx = ua.includes('micromessenger');
    const isAli = ua.includes('alipayclient');

    setIsWeChat(isWx);
    setIsAlipay(isAli);
  }, []);

  const selectedTier = tiers.find((tier) => tier.id === selectedTierId) ?? null;

  const handleConfirm = () => {
    if (!selectedTier) return;
    const paymentMethod = selectedPayment ?? (isAlipay ? 'alipay' : 'wechat_pay');
    onConfirm(selectedTier, paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-bold text-text-main">{t('community.auto_n150cf9c5', '开通圈子会员')}</h3>
          <IconButton icon={<X className="w-5 h-5" />} onClick={onClose} aria-label="close" />
        </div>

        {/* 圈子信息 */}
        <div className="flex items-center gap-3 mb-4">
          <img src={communityCoverImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-text-main">{communityName}</span>
            <span className="text-[12px] text-text-sub">{t('community.auto_25f42a69', '付费圈子')}</span>
          </div>
        </div>

        {/* 会员等级选择 */}
        <div className="flex flex-col gap-2 mb-4">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTierId(tier.id)}
              className={cn(
                "flex items-center justify-between w-full rounded-xl border px-3 py-3 text-left transition-colors",
                selectedTierId === tier.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                  : "border-black/10 dark:border-white/10",
              )}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold text-text-main">{tier.name}</span>
                {tier.description && (
                  <span className="text-[12px] text-text-sub line-clamp-1">{tier.description}</span>
                )}
                <span className="text-[12px] text-text-sub">
                  {tier.durationDays >= 365
                    ? `${Math.round(tier.durationDays / 365)} 年有效`
                    : `${tier.durationDays} 天有效`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[18px] font-bold text-red-500">¥{tier.price}</span>
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center",
                    selectedTierId === tier.id ? "border-blue-500" : "border-black/20 dark:border-white/25",
                  )}
                >
                  {selectedTierId === tier.id && <Check className="w-3 h-3 text-blue-500" />}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 权益预览 */}
        {selectedTier && selectedTier.benefits.length > 0 && (
          <div className="mb-4 rounded-xl bg-chat-active-bg p-3 flex flex-col gap-1.5">
            {selectedTier.benefits.map((benefit) => (
              <span key={benefit} className="text-[13px] text-text-main flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-500" /> {benefit}
              </span>
            ))}
          </div>
        )}

        {/* 支付方式 */}
        {!isWeChat && !isAlipay && (
          <div className="flex flex-col gap-2 mb-4">
            <span className="text-[13px] text-text-sub">{t('community.auto_2b2c2b90', '支付方式')}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPayment('wechat_pay')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[14px] font-medium",
                  selectedPayment === 'wechat_pay' ? "border-[#07C160] bg-[#07C160]/10 text-[#07C160]" : "border-black/10 dark:border-white/10 text-text-main",
                )}
              >
                <MessageSquare className="w-4 h-4" /> 微信支付
              </button>
              <button
                onClick={() => setSelectedPayment('alipay')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[14px] font-medium",
                  selectedPayment === 'alipay' ? "border-[#1677FF] bg-[#1677FF]/10 text-[#1677FF]" : "border-black/10 dark:border-white/10 text-text-main",
                )}
              >
                支付宝支付
              </button>
            </div>
          </div>
        )}

        {/* 立即支付 */}
        <button
          onClick={handleConfirm}
          disabled={!selectedTier}
          className="w-full rounded-xl bg-blue-500 py-3 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {selectedTier ? `立即支付 ¥${selectedTier.price}` : t('community.auto_n150cf9c5', '请选择会员等级')}
        </button>

        <div className="mt-3 flex items-center justify-center gap-1 text-[12px] text-text-sub">
          <Lock className="w-3 h-3" />
          {t('community.auto_n150cf9c5', '支付将通过安全收银台完成')}
        </div>
      </div>
    </div>
  );
};

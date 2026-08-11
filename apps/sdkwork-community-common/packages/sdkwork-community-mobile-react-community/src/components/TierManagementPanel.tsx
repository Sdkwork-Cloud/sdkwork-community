import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn, IconButton, showToast } from "@sdkwork/ui-mobile-react";
import { Plus, Check, X, Trash2, Power, Pencil } from "lucide-react";
import { CommunityService } from "../services/CommunityService";
import type { MembershipTier } from "../types";

interface TierManagementPanelProps {
  communityId: string;
}

interface TierFormState {
  name: string;
  description: string;
  price: string;
  durationDays: string;
  benefits: string;
  sortOrder: string;
}

const EMPTY_FORM: TierFormState = {
  name: "",
  description: "",
  price: "",
  durationDays: "365",
  benefits: "",
  sortOrder: "0",
};

/**
 * Circle owner membership-tier management (会员等级管理).
 *
 * Owners create/edit tiers and publish them — publishing registers the
 * purchasable membership package through the backend (sdkwork-order
 * `packageId`) so the tier appears on the purchase surface.
 */
export const TierManagementPanel: React.FC<TierManagementPanelProps> = ({ communityId }) => {
  const { t } = useTranslation();
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const [form, setForm] = useState<TierFormState>(EMPTY_FORM);

  const loadTiers = async () => {
    setIsLoading(true);
    try {
      // Owner management view includes unpublished tiers.
      setTiers(await CommunityService.listAllMembershipTiers(communityId));
    } catch {
      showToast(t('community.auto_fn_2796529c', '获取圈子配置失败'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const openCreate = () => {
    setEditingTier(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (tier: MembershipTier) => {
    setEditingTier(tier);
    setForm({
      name: tier.name,
      description: tier.description ?? "",
      price: String(tier.price),
      durationDays: String(tier.durationDays),
      benefits: tier.benefits.join("\n"),
      sortOrder: String(tier.sortOrder),
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showToast(t('community.auto_fn_n4fe6e34c', '请输入等级名称'));
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      showToast('请输入有效的价格');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price,
      durationDays: Number(form.durationDays) || 365,
      benefits: form.benefits.split("\n").map((item) => item.trim()).filter(Boolean),
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editingTier) {
        await CommunityService.updateMembershipTier(communityId, editingTier.id, payload);
      } else {
        await CommunityService.createMembershipTier(communityId, payload);
      }
      setShowForm(false);
      await loadTiers();
    } catch {
      showToast(t('community.auto_fn_2f078e83', '操作失败'));
    }
  };

  const handlePublish = async (tier: MembershipTier) => {
    try {
      if (tier.enabled) {
        await CommunityService.unpublishMembershipTier(communityId, tier.id);
      } else {
        await CommunityService.publishMembershipTier(communityId, tier.id);
      }
      await loadTiers();
    } catch {
      showToast('上下架失败，请确认商品服务已配置');
    }
  };

  const handleDelete = async (tier: MembershipTier) => {
    try {
      await CommunityService.deleteMembershipTier(communityId, tier.id);
      await loadTiers();
    } catch {
      showToast(t('community.auto_fn_2f078e83', '操作失败'));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-text-main">{t('community.auto_28f0bff6', '会员等级')}</span>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-[13px] font-medium text-white"
        >
          <Plus className="w-3.5 h-3.5" /> 新建等级
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-text-sub py-6">加载中...</div>
      ) : tiers.length === 0 ? (
        <div className="text-center text-text-sub py-6 text-[13px]">
          暂无会员等级，创建后可上架销售
        </div>
      ) : (
        tiers.map((tier) => (
          <div
            key={tier.id}
            className="rounded-xl border border-black/10 dark:border-white/10 p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-text-main">{tier.name}</span>
                <span className="text-[12px] text-text-sub">
                  ¥{tier.price} / {tier.durationDays >= 365 ? `${Math.round(tier.durationDays / 365)} 年` : `${tier.durationDays} 天`}
                  {tier.catalogPackageId ? ` · 商品 ${tier.catalogPackageId}` : ""}
                </span>
              </div>
              <span
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full",
                  tier.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-500/10 dark:bg-white/10 text-text-sub",
                )}
              >
                {tier.enabled ? "已上架" : "未上架"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePublish(tier)}
                className="flex items-center gap-1 text-[12px] text-blue-500"
              >
                <Power className="w-3.5 h-3.5" /> {tier.enabled ? "下架" : "上架"}
              </button>
              <button
                onClick={() => openEdit(tier)}
                className="flex items-center gap-1 text-[12px] text-text-sub"
              >
                <Pencil className="w-3.5 h-3.5" /> 编辑
              </button>
              <button
                onClick={() => handleDelete(tier)}
                className="flex items-center gap-1 text-[12px] text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" /> 删除
              </button>
            </div>
          </div>
        ))
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold text-text-main">
                {editingTier ? "编辑会员等级" : "新建会员等级"}
              </h3>
              <IconButton icon={<X className="w-5 h-5" />} onClick={() => setShowForm(false)} aria-label="close" />
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-text-sub">等级名称 *</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如：高级会员"
                  className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-[14px] bg-transparent"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-text-sub">等级描述</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="等级简介"
                  className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-[14px] bg-transparent"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[13px] text-text-sub">价格（元）*</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="199"
                    className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-[14px] bg-transparent"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[13px] text-text-sub">有效期（天）</span>
                  <input
                    type="number"
                    value={form.durationDays}
                    onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                    placeholder="365"
                    className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-[14px] bg-transparent"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-text-sub">权益（每行一条）</span>
                <textarea
                  value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  placeholder={"圈子全部内容\n官方交流群\n专属直播"}
                  rows={3}
                  className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-[14px] bg-transparent"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-text-sub">排序</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-[14px] bg-transparent"
                />
              </label>

              <button
                onClick={handleSubmit}
                className="w-full rounded-xl bg-blue-500 py-3 text-[15px] font-semibold text-white"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

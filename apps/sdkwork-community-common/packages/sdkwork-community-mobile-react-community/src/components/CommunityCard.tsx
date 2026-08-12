import { useTranslation } from "react-i18next";
import React from "react";
import { IconButton } from "@sdkwork/ui-mobile-react";
import { CommunityImage } from "./CommunityImage";
import { Users, MessageSquare, Check, MoreHorizontal } from "lucide-react";
import { Community } from "../types";

interface CommunityCardProps {
  community: Community;
  onClick?: () => void;
  onLongPressProps?: any;
  onMoreClick?: (e: React.MouseEvent) => void;
  onJoinClick?: (e: React.MouseEvent) => void;
}

/**
 * Circle list item: circular avatar + circle name, compact metadata row and
 * a join action. No full-width cover image — the avatar always renders (with
 * an initials fallback), so the card can never be dominated by a broken
 * image.
 */
export const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  onClick,
  onLongPressProps,
  onMoreClick,
  onJoinClick,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="bg-white dark:bg-[#1E1E1E] mb-2 px-3 py-3 cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5"
      onClick={onClick}
      {...onLongPressProps}
    >
      <div className="flex items-start gap-3 pointer-events-none">
        <CommunityImage
          src={community.avatar}
          alt={community.name}
          fallbackSeed={community.name}
          className="w-14 h-14 rounded-full object-cover shrink-0 bg-black/5 dark:bg-white/10"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[16px] font-semibold text-text-main truncate">
              {community.name}
            </h3>
            {onMoreClick && (
              <div className="pointer-events-auto shrink-0">
                <IconButton
                  icon={<MoreHorizontal className="w-5 h-5 text-text-sub" />}
                  className="bg-transparent w-8 h-8 -mr-2"
                  onClick={onMoreClick}
                />
              </div>
            )}
          </div>

          {community.description && (
            <p className="text-[13px] text-text-sub line-clamp-1 mt-0.5 leading-relaxed">
              {community.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
            {community.isPaid && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 shrink-0">
                {t("community.auto_paid_badge", "付费")}
              </span>
            )}
            {community.isAgentCircle && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
                {t("community.auto_agent_badge", "代理商")}
              </span>
            )}
            {community.isRecommended && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                {t("community.auto_recommended_badge", "推荐")}
              </span>
            )}
            {community.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] text-text-sub shrink-0"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1 text-text-sub shrink-0">
                <Users className="w-4 h-4 shrink-0" />
                <span className="text-[12px] whitespace-nowrap">
                  {t("community.auto_n4e746140", "{{memberCount}} 成员", { memberCount: community.memberCount })}
                  {community.memberLimit ? `/${community.memberLimit}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 text-text-sub shrink-0">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-[12px] whitespace-nowrap">
                  {t("community.auto_ndae6275", "{{postCount}} 动态", { postCount: community.postCount })}
                </span>
              </div>
            </div>

            {onJoinClick && (
              <div className="pointer-events-auto shrink-0">
                {community.isJoined ? (
                  <div className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-text-sub flex items-center gap-1 bg-black/5 dark:bg-white/5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[13px] font-medium whitespace-nowrap">
                      {t("community.auto_16afc37", "已加入")}
                    </span>
                  </div>
                ) : community.isPaid ? (
                  <button
                    onClick={onJoinClick}
                    className="px-4 py-1.5 rounded-full bg-orange-500 text-white font-medium text-[13px] shadow-sm shadow-orange-500/20 active:scale-[0.98] transition-transform whitespace-nowrap shrink-0"
                  >
                    {t("community.auto_n3990cdea", "¥{{price}} 加入", { price: community.price })}
                  </button>
                ) : (
                  <button
                    onClick={onJoinClick}
                    className="px-4 py-1.5 rounded-full bg-blue-500 text-white font-medium text-[13px] shadow-sm shadow-blue-500/20 active:scale-[0.98] transition-transform whitespace-nowrap shrink-0"
                  >
                    {t("community.auto_27118551", "免费加入")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

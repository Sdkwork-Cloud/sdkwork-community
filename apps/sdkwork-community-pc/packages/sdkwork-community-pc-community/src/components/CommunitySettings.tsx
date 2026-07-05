import { ChevronLeft, Info, Settings2 } from "lucide-react";
import {
  PC_COMMUNITY_SUPPORTED_TABS,
  type Community,
} from "../services/CommunityService";

export const CommunitySettings = ({
  community,
  onClose,
}: {
  community: Community;
  onClose: () => void;
  onUpdate?: (community: Community) => void;
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#1e1e20] text-gray-200 overflow-hidden flex flex-col">
      <div className="flex h-full">
        <div className="w-64 bg-[#252528] border-r border-white/5 flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-bold text-lg">圈子信息</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-indigo-500/10 text-indigo-400">
              <Settings2 size={18} /> 基本信息
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#1e1e20]">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-[#252528] p-6 rounded-2xl border border-white/5">
              <div className="flex items-start gap-3 text-sm text-amber-200/90">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p>
                  圈子设置由后台管理 API 提供。当前 App API 支持分类浏览、动态发布与评论；分类信息修改将在后台管理合约开放后启用。
                </p>
              </div>
            </div>

            <div className="bg-[#2b2b2d] rounded-2xl border border-white/5 p-8 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">名称</div>
                <div className="text-lg font-bold text-gray-100">{community.name}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">简介</div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {community.description || "暂无简介"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">已开放模块</div>
                <div className="flex flex-wrap gap-2">
                  {PC_COMMUNITY_SUPPORTED_TABS.map((tab) => (
                    <span
                      key={tab}
                      className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-sm"
                    >
                      {tab === "feeds" ? "动态" : tab}
                    </span>
                  ))}
                </div>
              </div>
              {community.tags.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">标签</div>
                  <div className="flex flex-wrap gap-2">
                    {community.tags.map((tag) => (
                      <span key={tag} className="bg-white/5 px-3 py-1 rounded-full text-sm text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

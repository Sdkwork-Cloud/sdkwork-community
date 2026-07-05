import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Compass, Plus, Search, Star, TrendingUp, Users } from "lucide-react";
import { communityService, type Community } from "../services/CommunityService";
import { CommunityDetail } from "./CommunityDetail";

interface CommunityViewProps {
  initialCommunityId?: string;
  onInitialCommunityHandled?: () => void;
}

export const CommunityView = ({
  initialCommunityId,
  onInitialCommunityHandled,
}: CommunityViewProps = {}) => {
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);

  useEffect(() => {
    if (!initialCommunityId) {
      return undefined;
    }

    let mounted = true;
    void communityService.getCommunity(initialCommunityId).then((community) => {
      if (mounted && community) {
        setActiveCommunity(community);
      }
      onInitialCommunityHandled?.();
    });

    return () => {
      mounted = false;
    };
  }, [initialCommunityId, onInitialCommunityHandled]);

  if (activeCommunity) {
    return (
      <CommunityDetail
        community={activeCommunity}
        onBack={() => setActiveCommunity(null)}
        onUpdate={setActiveCommunity}
      />
    );
  }

  return <CommunityHome onSelectCommunity={setActiveCommunity} />;
};

const CommunityHome = ({
  onSelectCommunity,
}: {
  onSelectCommunity: (community: Community) => void;
}) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    void communityService.getCommunities().then((data) => {
      setCommunities(data);
      setLoading(false);
    });
  }, []);

  const filteredCommunities = communities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e20] text-gray-200 overflow-y-auto custom-scrollbar h-full">
      <div className="sticky top-0 z-10 bg-[#1e1e20]/80 backdrop-blur-md border-b border-white/5 p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Users className="text-indigo-400" />
          全员社群圈子
        </h1>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="搜索感兴趣的圈子..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#2b2b2d] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:border-indigo-500 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="flex gap-4 mb-8 overflow-x-auto custom-scrollbar pb-2">
          <button
            type="button"
            className="bg-white/10 hover:bg-white/15 px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors border border-white/5"
          >
            <Compass size={16} className="text-blue-400" /> 发现圈子
          </button>
          <button
            type="button"
            className="bg-[#2b2b2d] hover:bg-white/5 px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors border border-transparent"
          >
            <Star size={16} className="text-yellow-400" /> 我加入的
          </button>
          <button
            type="button"
            className="bg-[#2b2b2d] hover:bg-white/5 px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors border border-transparent"
          >
            <TrendingUp size={16} className="text-green-400" /> 热门推荐
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCommunities.map((community) => (
              <motion.div
                whileHover={{ y: -4 }}
                key={community.id}
                onClick={() => onSelectCommunity(community)}
                className="bg-[#2b2b2d] rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/30 transition-colors cursor-pointer group flex flex-col"
              >
                <div className="h-32 relative">
                  <img
                    src={community.cover}
                    alt="Cover"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2b2b2d] to-transparent" />
                  <div className="absolute -bottom-6 left-4 p-1 bg-[#2b2b2d] rounded-full">
                    <img
                      src={community.avatar}
                      alt={community.name}
                      className="w-16 h-16 rounded-full border-2 border-[#2b2b2d] object-cover"
                    />
                  </div>
                </div>
                <div className="pt-8 p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-100 mb-2 truncate group-hover:text-indigo-400 transition-colors">
                    {community.name}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                    {community.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {community.membersCount} 成员
                    </span>
                    <div className="flex gap-1.5">
                      {community.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="bg-white/5 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

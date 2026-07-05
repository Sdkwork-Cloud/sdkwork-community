import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  Edit2,
  Heart,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { isBlank, trim } from "@sdkwork/utils";
import { useCommunityPcHost } from "../host";
import {
  communityService,
  PC_COMMUNITY_MEDIA_UNAVAILABLE,
  type Community,
  type CommunityComment,
  type Post,
} from "../services/CommunityService";
import { CommunitySettings } from "./CommunitySettings";

interface CommunityDetailProps {
  community: Community;
  onBack: () => void;
  onUpdate: (community: Community) => void;
}

export function CommunityDetail({ community, onBack, onUpdate }: CommunityDetailProps) {
  const { toast, Avatar, readSessionTokens } = useCommunityPcHost();
  const sessionUser = readSessionTokens()?.user;
  const currentUserId = sessionUser?.id ?? "";
  const currentUserName =
    sessionUser?.displayName ?? sessionUser?.nickname ?? sessionUser?.name ?? "Me";
  const currentUserAvatar = sessionUser?.avatar ?? "";

  const [showSettings, setShowSettings] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, CommunityComment[]>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [openPostDropdown, setOpenPostDropdown] = useState<string | null>(null);

  useEffect(() => {
    void communityService.getPosts(community.id).then(setPosts);
  }, [community.id]);

  useEffect(() => {
    for (const postId of Object.keys(expandedComments)) {
      if (!expandedComments[postId]) {
        continue;
      }
      void communityService
        .getComments(postId)
        .then((comments) => {
          setPostComments((prev) => ({ ...prev, [postId]: comments }));
        })
        .catch(() => {
          setPostComments((prev) => ({ ...prev, [postId]: [] }));
        });
    }
  }, [expandedComments]);

  const submitComment = async (postId: string) => {
    const content = trim(commentInputs[postId] ?? "");
    if (isBlank(content)) {
      return;
    }
    try {
      await communityService.createComment(community.id, postId, content);
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      const [comments, refreshedPosts] = await Promise.all([
        communityService.getComments(postId),
        communityService.getPosts(community.id),
      ]);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
      setPosts(refreshedPosts);
      toast("评论已发布", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "评论发布失败", "error");
    }
  };

  const handlePost = async () => {
    if (isBlank(trim(newPostContent))) {
      return;
    }
    setIsPosting(true);
    try {
      const newPost = await communityService.createPost(community.id, newPostContent);
      setPosts((current) => [newPost, ...current]);
      setNewPostContent("");
      toast("发布成功", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "发布失败", "error");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (post: Post) => {
    const nextActive = !likedPosts[post.id];
    try {
      const result = await communityService.setPostReaction(post.id, nextActive);
      setLikedPosts((current) => ({ ...current, [post.id]: result.active }));
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, likes: result.reactionCount } : item,
        ),
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "点赞失败", "error");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await communityService.deletePost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
      setOpenPostDropdown(null);
      toast("动态已删除", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e20] h-full overflow-hidden relative text-gray-200">
      <div className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col z-0">
        <div className="h-64 relative shrink-0">
          <img src={community.cover} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e20] via-[#1e1e20]/60 to-transparent" />

          <button
            type="button"
            onClick={onBack}
            className="absolute top-6 left-6 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="absolute bottom-6 left-8 right-8 flex items-end gap-6">
            <img
              src={community.avatar}
              alt={community.name}
              className="w-24 h-24 rounded-lg border-4 border-[#1e1e20] object-cover shadow-2xl"
            />
            <div className="flex-1 mb-1">
              <h1 className="text-3xl font-bold text-white mb-2">{community.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Users size={16} /> {community.membersCount} 成员
                </span>
                <span>•</span>
                <span>{community.description}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-lg mb-2 flex items-center gap-2 border border-white/10"
            >
              <Edit2 size={16} /> 圈子信息
            </button>
          </div>
        </div>

        <div className="px-8 mt-6 shrink-0">
          <div className="flex border-b border-white/10 gap-8">
            <button
              type="button"
              className="pb-3 text-sm font-medium transition-colors relative text-indigo-400"
            >
              动态
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto p-8">
          <div className="space-y-6">
            <div className="bg-[#2b2b2d] rounded-2xl p-5 border border-white/5">
              <div className="flex gap-4">
                <Avatar
                  src={currentUserAvatar || undefined}
                  alt={currentUserName}
                  fallback={currentUserName.charAt(0) || "?"}
                  size="md"
                  shape="circle"
                />
                <div className="flex-1 flex flex-col gap-3">
                  <textarea
                    placeholder="分享你的想法、问题或经验..."
                    className="w-full bg-transparent border-none outline-none resize-none text-gray-200 text-sm placeholder-gray-500 min-h-[60px]"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toast(PC_COMMUNITY_MEDIA_UNAVAILABLE, "error")}
                        className="text-gray-400 hover:text-indigo-400 p-2 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <ImageIcon size={18} />
                      </button>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-indigo-400 p-2 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <Link2 size={18} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handlePost()}
                      disabled={isBlank(trim(newPostContent)) || isPosting}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-5 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {isPosting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      发布
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {posts.map((post) => (
              <div key={post.id} className="bg-[#2b2b2d] rounded-2xl p-5 border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={post.author.avatar || undefined}
                      alt={post.author.name}
                      fallback={post.author.name?.charAt(0) || "?"}
                      size="md"
                      shape="circle"
                    />
                    <div>
                      <div className="font-bold text-sm text-gray-200">{post.author.name}</div>
                      <div className="text-xs text-gray-500">{post.createdAt}</div>
                    </div>
                  </div>
                  <div className="relative">
                    {post.author.id === currentUserId && currentUserId ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenPostDropdown(openPostDropdown === post.id ? null : post.id)
                          }
                          className="text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-white/5 transition-colors"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openPostDropdown === post.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-[#252528] border border-white/5 rounded-xl shadow-2xl py-1 z-10">
                            <button
                              type="button"
                              onClick={() => void handleDeletePost(post.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                              <Trash2 size={14} /> 删除动态
                            </button>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="text-sm text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </div>

                <div className="flex items-center gap-6 text-gray-500 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => void handleLikePost(post)}
                    className={`flex items-center gap-2 text-sm transition-colors hover:text-pink-500 ${
                      likedPosts[post.id] ? "text-pink-500" : ""
                    }`}
                  >
                    <Heart size={18} fill={likedPosts[post.id] ? "currentColor" : "none"} />{" "}
                    {post.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                    }
                    className="flex items-center gap-2 text-sm hover:text-indigo-400 transition-colors"
                  >
                    <MessageCircle size={18} /> {post.comments}
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors ml-auto"
                  >
                    <Share2 size={18} /> 分享
                  </button>
                </div>

                {expandedComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex gap-3 mb-4">
                      <Avatar
                        src={currentUserAvatar || undefined}
                        alt={currentUserName}
                        fallback={currentUserName.charAt(0) || "?"}
                        size="sm"
                        shape="circle"
                      />
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="发表你的评论..."
                          className="flex-1 bg-[#1e1e20] border border-white/10 rounded-full px-4 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors text-gray-200"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              void submitComment(post.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={isBlank(trim(commentInputs[post.id] ?? ""))}
                          onClick={() => void submitComment(post.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2 rounded-full transition-colors shrink-0"
                        >
                          <Send size={16} className="-ml-0.5 mt-0.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(postComments[post.id] ?? []).length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-4">
                          {post.comments > 0 ? "评论加载中..." : "暂无评论，快来抢沙发吧~"}
                        </div>
                      ) : (
                        (postComments[post.id] ?? []).map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar
                              src={comment.author.avatar || undefined}
                              alt={comment.author.name}
                              fallback={comment.author.name?.charAt(0) || "?"}
                              size="sm"
                              shape="circle"
                            />
                            <div className="flex-1 bg-[#1e1e20] rounded-xl px-4 py-3 border border-white/5">
                              <div className="text-sm font-medium text-gray-200 mb-1">
                                {comment.author.name}
                              </div>
                              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                                {comment.body}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSettings && (
        <CommunitySettings
          community={community}
          onClose={() => setShowSettings(false)}
          onUpdate={(updated) => {
            setShowSettings(false);
            onUpdate(updated);
          }}
        />
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

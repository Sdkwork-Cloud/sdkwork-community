-- PC inspiration data consumed through the Community App SDK.
INSERT INTO community_category (
    id, tenant_id, slug, title, description, priority, enabled, created_at, updated_at
)
VALUES (
    'community-category-agents-inspiration',
    '100001',
    'agents-inspiration',
    'Agents 灵感广场',
    'SDKWork Agents PC 发现、短片与活动内容',
    100,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    priority = EXCLUDED.priority,
    enabled = EXCLUDED.enabled,
    updated_at = EXCLUDED.updated_at;

INSERT INTO community_tag (id, tenant_id, slug, title, created_at)
VALUES
    ('community-tag-agents-inspiration-discover', '100001', 'agents-inspiration-discover', 'Agents 发现', CURRENT_TIMESTAMP),
    ('community-tag-agents-inspiration-short-video', '100001', 'agents-inspiration-short-video', 'Agents 短片', CURRENT_TIMESTAMP),
    ('community-tag-agents-inspiration-activity', '100001', 'agents-inspiration-activity', 'Agents 活动', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title;

INSERT INTO community_entry (
    id, tenant_id, category_id, author_id, author_name, slug, kind, title, excerpt,
    review_state, is_featured, is_pinned, reaction_count, view_count,
    published_at, last_activity_at, created_at, updated_at
)
VALUES
    ('community-agents-discover-banner', '100001', 'community-category-agents-inspiration', 'official-team', '官方团队', 'agents-discover-art-season', 'resource', '2026大学生AI艺术季', 'AI 影像创作单元官方视觉', 'approved', TRUE, TRUE, 812, 2180, '2026-07-09T08:00:00Z', '2026-07-09T08:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-discover-01', '100001', 'community-category-agents-inspiration', 'creator-xiaoming', '小明', 'agents-discover-sunlit-hills', 'resource', '日光下的绿色山丘', '写实自然光影创作', 'approved', FALSE, FALSE, 128, 540, '2026-07-08T08:00:00Z', '2026-07-08T08:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-discover-02', '100001', 'community-category-agents-inspiration', 'creator-alice', 'Alice', 'agents-discover-golden-portrait', 'resource', '黄金时刻人像', '电影质感经典人像', 'approved', FALSE, FALSE, 45, 270, '2026-07-07T08:00:00Z', '2026-07-07T08:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-discover-03', '100001', 'community-category-agents-inspiration', 'creator-bob', 'Bob', 'agents-discover-cozy-portrait', 'resource', '暖调毛衣人像', '柔和氛围人像创作', 'approved', FALSE, FALSE, 89, 332, '2026-07-06T08:00:00Z', '2026-07-06T08:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-discover-04', '100001', 'community-category-agents-inspiration', 'creator-hanxiao', '韩啸', 'agents-discover-ink-hero', 'resource', '水墨幻想英雄', '高对比水墨角色设计', 'approved', FALSE, FALSE, 116, 408, '2026-07-05T08:00:00Z', '2026-07-05T08:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-discover-05', '100001', 'community-category-agents-inspiration', 'creator-yuanbao', '元宝', 'agents-discover-blue-elegance', 'resource', '深海蓝色优雅', '发光深海写实渲染', 'approved', FALSE, FALSE, 234, 760, '2026-07-04T08:00:00Z', '2026-07-04T08:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-discover-06', '100001', 'community-category-agents-inspiration', 'creator-eve', 'Eve', 'agents-discover-mystic-cat', 'resource', '神秘黑猫', '微距毛发与绿色眼眸', 'approved', FALSE, FALSE, 890, 1830, '2026-07-03T08:00:00Z', '2026-07-03T08:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-video-01', '100001', 'community-category-agents-inspiration', 'creator-huosheng', '活圣圣', 'agents-video-authentication', 'resource', '原创AI短片《认证》', '一个没有通过算法认证的老人，在风雪、羊群和土地中寻找答案。', 'approved', FALSE, FALSE, 1358, 4900, '2026-07-10T08:00:00Z', '2026-07-10T08:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-video-02', '100001', 'community-category-agents-inspiration', 'creator-asheng', '阿生的AI', 'agents-video-paper-spirit', 'resource', '《百匠：纸契灵》', '异族可借风沙掩星辰，百匠合一为侍魂。', 'approved', FALSE, FALSE, 640, 2710, '2026-07-09T10:00:00Z', '2026-07-09T10:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-video-03', '100001', 'community-category-agents-inspiration', 'creator-lingxiang', '灵湘_SSS', 'agents-video-epang-palace', 'resource', '原创AI动画《阿房宫》', '工匠少年夜闯阿房宫，只为拯救病危的阿母。', 'approved', FALSE, FALSE, 492, 2260, '2026-07-08T10:00:00Z', '2026-07-08T10:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-activity-01', '100001', 'community-category-agents-inspiration', 'official-team', '官方团队', 'agents-activity-aigc-awards', 'announcement', 'AIGC 影像推荐单元', '面向全球征集 AI 影像短片，发掘兼具技术突破与电影艺术价值的作品。', 'approved', TRUE, FALSE, 613, 3120, '2026-07-01T00:00:00Z', '2026-07-10T00:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-agents-activity-02', '100001', 'community-category-agents-inspiration', 'official-team', '官方团队', 'agents-activity-brand-video', 'announcement', 'AI 品牌视频创作大赛', '用 AI 视频讲述品牌故事，探索高质量商业影像表达。', 'approved', FALSE, FALSE, 775, 2650, '2026-07-02T00:00:00Z', '2026-07-09T00:00:00Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    review_state = EXCLUDED.review_state,
    is_featured = EXCLUDED.is_featured,
    is_pinned = EXCLUDED.is_pinned,
    reaction_count = EXCLUDED.reaction_count,
    view_count = EXCLUDED.view_count,
    published_at = EXCLUDED.published_at,
    last_activity_at = EXCLUDED.last_activity_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO community_entry_body (entry_id, body_markdown, body_format, updated_at)
VALUES
    ('community-agents-discover-banner', $json${"src":"https://images.unsplash.com/photo-1620311497210-67ee56d11e5c?w=1600&q=85","alt":"2026大学生AI艺术季","prompt":"AI影像创作单元官方海报，科幻梦幻极简微缩立体风格","avatar":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80","date":"2026-07-09","aspectRatio":"21:9","model":"SDKWork Image","isBanner":true}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-discover-01', $json${"src":"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=85","alt":"sunlit hills","prompt":"Girl running in the sun on lush green hills, realistic light, 8k","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80","aspectRatio":"4:5","model":"SDKWork Image"}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-discover-02', $json${"src":"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&q=85","alt":"golden portrait","prompt":"A cinematic portrait in warm golden hour tones","avatar":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80","aspectRatio":"4:5","model":"SDKWork Image"}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-discover-03', $json${"src":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1?w=900&q=85","alt":"cozy portrait","prompt":"Cozy portrait with soft moody lighting and cinematic atmosphere","avatar":"https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80","aspectRatio":"3:4","model":"SDKWork Image"}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-discover-04', $json${"src":"https://images.unsplash.com/photo-1514539079130-25950c84af65?w=900&q=85","alt":"ink hero","prompt":"High contrast ink illustration of a fantasy hero","avatar":"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&q=80","aspectRatio":"3:4","model":"SDKWork Image"}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-discover-05', $json${"src":"https://images.unsplash.com/photo-1550684376-efcb96075908?w=900&q=85","alt":"blue elegance","prompt":"A glowing silhouette under deep blue neon water, magical realistic render","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80","aspectRatio":"4:5","model":"SDKWork Image"}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-discover-06', $json${"src":"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&q=85","alt":"mystic cat","prompt":"Fluffy black cat with glowing green eyes, realistic macro fur detail","avatar":"https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80","aspectRatio":"1:1","model":"SDKWork Image"}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-video-01', $json${"cover":"https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000&q=85","videoUrl":"https://assets.mixkit.co/videos/preview/mixkit-space-exploration-with-a-retro-futuristic-computer-43180-large.mp4","duration":"05:52","avatar":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80"}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-video-02', $json${"cover":"https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1000&q=85","videoUrl":"https://assets.mixkit.co/videos/preview/mixkit-girl-running-on-the-wet-grass-at-sunrise-44754-large.mp4","duration":"08:19","avatar":"https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80"}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-video-03', $json${"cover":"https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1000&q=85","videoUrl":"https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4","duration":"15:46","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-activity-01', $json${"status":"征集中","tag":"官方展映与创作扶持","participants":613,"cover":"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=85","banner":"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1800&q=90","background":"本活动以光影新纪元、AI创未来为主题，面向全球创作者征集优质 AI 影像短片，鼓励探索 AI 在影视创作中的创新应用。","timeRange":"2026-06-30 00:00:00 - 2026-08-20 23:59:59","works":[{"id":"activity-01-work-01","title":"《临水》","author":"YoRHa","avatar":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80","likes":72,"duration":"06:53","cover":"https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=900&q=85","videoUrl":"https://assets.mixkit.co/videos/preview/mixkit-space-exploration-with-a-retro-futuristic-computer-43180-large.mp4","desc":"以水乡记忆为线索的 AI 影像短片。"},{"id":"activity-01-work-02","title":"《荔镜缘》","author":"Yizen","avatar":"https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80","likes":41,"duration":"15:47","cover":"https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=85","videoUrl":"https://assets.mixkit.co/videos/preview/mixkit-girl-running-on-the-wet-grass-at-sunrise-44754-large.mp4","desc":"融合传统文化与三维动画表达的 AIGC 作品。"}]}$json$, 'json', CURRENT_TIMESTAMP),
    ('community-agents-activity-02', $json${"status":"征集中","tag":"创作奖金与流量扶持","participants":775,"cover":"https://images.unsplash.com/photo-1527960656366-ee2a999e32e6?w=1200&q=85","banner":"https://images.unsplash.com/photo-1527960656366-ee2a999e32e6?w=1800&q=90","background":"围绕品牌产品与真实消费场景，用 AI 影像探索富有感染力的商业叙事。","timeRange":"2026-07-01 00:00:00 - 2026-08-25 23:59:59","works":[]}$json$, 'json', CURRENT_TIMESTAMP)
ON CONFLICT (entry_id) DO UPDATE SET
    body_markdown = EXCLUDED.body_markdown,
    body_format = EXCLUDED.body_format,
    updated_at = EXCLUDED.updated_at;

INSERT INTO community_entry_tag (entry_id, tag_id)
VALUES
    ('community-agents-discover-banner', 'community-tag-agents-inspiration-discover'),
    ('community-agents-discover-01', 'community-tag-agents-inspiration-discover'),
    ('community-agents-discover-02', 'community-tag-agents-inspiration-discover'),
    ('community-agents-discover-03', 'community-tag-agents-inspiration-discover'),
    ('community-agents-discover-04', 'community-tag-agents-inspiration-discover'),
    ('community-agents-discover-05', 'community-tag-agents-inspiration-discover'),
    ('community-agents-discover-06', 'community-tag-agents-inspiration-discover'),
    ('community-agents-video-01', 'community-tag-agents-inspiration-short-video'),
    ('community-agents-video-02', 'community-tag-agents-inspiration-short-video'),
    ('community-agents-video-03', 'community-tag-agents-inspiration-short-video'),
    ('community-agents-activity-01', 'community-tag-agents-inspiration-activity'),
    ('community-agents-activity-02', 'community-tag-agents-inspiration-activity')
ON CONFLICT (entry_id, tag_id) DO NOTHING;

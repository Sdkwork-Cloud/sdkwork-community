-- Official default circles (圈子) for sdkwork-community.
--
-- Idempotent seed data so production can go live with official free and paid
-- circles: an official AI learning circle, announcement circle, product and
-- indie-hacker circles, plus paid professional circles (LLM practice, AIGC
-- creation, AI product). Each circle ships with an owner membership, official
-- welcome entries and an official group so users never enter an empty circle.
--
-- Owner identity: the platform official account (sdkwork-official).

-- ---------------------------------------------------------------------------
-- 1. Official circles (community_category)
-- ---------------------------------------------------------------------------
INSERT INTO community_category (
    id, tenant_id, slug, title, description, cover_image, avatar, owner_id,
    member_count, post_count, is_paid, price, tags, priority, enabled,
    created_at, updated_at
)
VALUES
    (
        'community-circle-official-ai-learning', '100001', 'official-ai-learning',
        '官方 AI 学习圈',
        'SDKWork 官方出品的人工智能入门与进阶学习圈：AI 基础、机器学习、大模型应用、学习路线与答疑，一站式开启你的 AI 学习之旅。',
        'https://placehold.co/800x400/2b5ce7/ffffff/png?text=AI+Learning',
        'https://api.dicebear.com/7.x/initials/png?seed=AI+Learning&backgroundColor=2b5ce7',
        'sdkwork-official', 1, 2, FALSE, NULL,
        ARRAY['AI', '机器学习', '大模型', '官方'], 100, TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-circle-official-announcements', '100001', 'official-announcements',
        '官方公告圈',
        'SDKWork 平台官方公告：产品更新、功能上线、活动通知与使用指南，第一时间掌握平台动态。',
        'https://placehold.co/800x400/2b5ce7/ffffff/png?text=Announcements',
        'https://api.dicebear.com/7.x/initials/png?seed=Announcements&backgroundColor=2b5ce7',
        'sdkwork-official', 1, 1, FALSE, NULL,
        ARRAY['官方', '公告'], 90, TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-circle-official-product-managers', '100001', 'official-product-managers',
        '产品经理交流圈',
        '官方产品经理社区：产品方法论、需求分析、增长与商业化实战，与优秀的产品人一起成长。',
        'https://placehold.co/800x400/2b5ce7/ffffff/png?text=Product+Managers',
        'https://api.dicebear.com/7.x/initials/png?seed=Product+Managers&backgroundColor=2b5ce7',
        'sdkwork-official', 1, 1, FALSE, NULL,
        ARRAY['产品', '增长', '方法论'], 80, TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-circle-official-indie-hackers', '100001', 'official-indie-hackers',
        '独立开发者聚集地',
        '官方独立开发者社区：一人公司、出海经验、变现思路与技术选型，一起把想法变成产品。',
        'https://placehold.co/800x400/2b5ce7/ffffff/png?text=Indie+Hackers',
        'https://api.dicebear.com/7.x/initials/png?seed=Indie+Hackers&backgroundColor=2b5ce7',
        'sdkwork-official', 1, 1, FALSE, NULL,
        ARRAY['独立开发', '出海', '变现'], 70, TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-circle-official-llm-advanced', '100001', 'official-llm-advanced',
        'AI 大模型实战进阶（付费）',
        '官方付费圈：大模型应用开发实战、RAG 架构、微调与评估、Agent 编排，面向有基础的开发者深度进阶。',
        'https://placehold.co/800x400/2b5ce7/ffffff/png?text=LLM+Advanced',
        'https://api.dicebear.com/7.x/initials/png?seed=LLM+Advanced&backgroundColor=2b5ce7',
        'sdkwork-official', 1, 1, TRUE, 199,
        ARRAY['大模型', 'RAG', '微调', 'Agent'], 60, TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-circle-official-aigc-creation', '100001', 'official-aigc-creation',
        'AIGC 创作训练营（付费）',
        '官方付费圈：提示词工程、AI 绘画、AI 视频与内容创作实战，从灵感生成到作品落地的完整训练。',
        'https://placehold.co/800x400/2b5ce7/ffffff/png?text=AIGC+Creation',
        'https://api.dicebear.com/7.x/initials/png?seed=AIGC+Creation&backgroundColor=2b5ce7',
        'sdkwork-official', 1, 1, TRUE, 99,
        ARRAY['AIGC', '提示词', 'AI 绘画', 'AI 视频'], 50, TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-circle-official-ai-product', '100001', 'official-ai-product',
        'AI 产品经理实战（付费）',
        '官方付费圈：AI 产品设计、需求洞察、商业化路径与落地案例，培养面向 AI 时代的顶尖产品经理。',
        'https://placehold.co/800x400/2b5ce7/ffffff/png?text=AI+Product',
        'https://api.dicebear.com/7.x/initials/png?seed=AI+Product&backgroundColor=2b5ce7',
        'sdkwork-official', 1, 1, TRUE, 99,
        ARRAY['AI 产品', '商业化', '实战'], 40, TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    cover_image = EXCLUDED.cover_image,
    avatar = EXCLUDED.avatar,
    owner_id = EXCLUDED.owner_id,
    member_count = EXCLUDED.member_count,
    post_count = EXCLUDED.post_count,
    is_paid = EXCLUDED.is_paid,
    price = EXCLUDED.price,
    tags = EXCLUDED.tags,
    priority = EXCLUDED.priority,
    enabled = EXCLUDED.enabled,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 2. Official membership (community_member): owner of every official circle
-- ---------------------------------------------------------------------------
INSERT INTO community_member (
    id, tenant_id, category_id, user_id, user_name, role, status, bio,
    joined_at, created_at, updated_at
)
SELECT
    'community-member-' || community_category.id || '-official-owner',
    '100001',
    community_category.id,
    'sdkwork-official',
    'SDKWork 官方',
    'owner',
    'active',
    'SDKWork 官方团队，负责圈子内容运营与答疑。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM community_category
WHERE tenant_id = '100001'
  AND owner_id = 'sdkwork-official'
ON CONFLICT (tenant_id, category_id, user_id) DO UPDATE SET
    user_name = EXCLUDED.user_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    bio = EXCLUDED.bio,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 3. Official tags (community_tag)
-- ---------------------------------------------------------------------------
INSERT INTO community_tag (id, tenant_id, slug, title, created_at)
VALUES
    ('community-tag-official-welcome', '100001', 'official-welcome', '官方欢迎', CURRENT_TIMESTAMP),
    ('community-tag-official-guide', '100001', 'official-guide', '官方指南', CURRENT_TIMESTAMP),
    ('community-tag-official-course', '100001', 'official-course', '课程学习', CURRENT_TIMESTAMP),
    ('community-tag-official-llm', '100001', 'official-llm', '大模型实战', CURRENT_TIMESTAMP),
    ('community-tag-official-aigc', '100001', 'official-aigc', 'AIGC 创作', CURRENT_TIMESTAMP),
    ('community-tag-official-ai-product', '100001', 'official-ai-product', 'AI 产品', CURRENT_TIMESTAMP),
    ('community-tag-official-news', '100001', 'official-news', '平台动态', CURRENT_TIMESTAMP),
    ('community-tag-official-product', '100001', 'official-product', '产品实战', CURRENT_TIMESTAMP),
    ('community-tag-official-indie', '100001', 'official-indie', '独立开发', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title;

-- ---------------------------------------------------------------------------
-- 4. Official welcome entries (community_entry + community_entry_body)
-- ---------------------------------------------------------------------------
INSERT INTO community_entry (
    id, tenant_id, category_id, author_id, author_name, slug, kind, title,
    excerpt, review_state, is_featured, is_pinned, has_accepted_answer,
    comment_count, reaction_count, share_count, view_count,
    published_at, last_activity_at, created_at, updated_at
)
VALUES
    (
        'community-entry-official-ai-learning-welcome', '100001',
        'community-circle-official-ai-learning', 'sdkwork-official', 'SDKWork 官方',
        'official-ai-learning-welcome', 'announcement',
        '欢迎加入官方 AI 学习圈',
        '这里汇聚了 AI 入门到进阶的系统学习路线、精选课程与官方答疑，祝学习愉快。',
        'approved', TRUE, TRUE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-ai-learning-roadmap', '100001',
        'community-circle-official-ai-learning', 'sdkwork-official', 'SDKWork 官方',
        'official-ai-learning-roadmap', 'discussion',
        'AI 学习路线：从零基础到上手大模型应用',
        '按基础理论、机器学习、深度学习、大模型应用四阶段规划学习路径，配套官方推荐资源。',
        'approved', TRUE, FALSE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-announcements-welcome', '100001',
        'community-circle-official-announcements', 'sdkwork-official', 'SDKWork 官方',
        'official-announcements-welcome', 'announcement',
        '官方公告圈上线，第一时间掌握平台动态',
        '产品更新、功能上线、活动通知与使用指南都会在这里发布，欢迎订阅关注。',
        'approved', TRUE, TRUE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-product-welcome', '100001',
        'community-circle-official-product-managers', 'sdkwork-official', 'SDKWork 官方',
        'official-product-welcome', 'announcement',
        '欢迎加入产品经理交流圈',
        '产品方法论、需求分析、增长与商业化实战内容持续更新，欢迎分享你的实践。',
        'approved', TRUE, TRUE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-indie-welcome', '100001',
        'community-circle-official-indie-hackers', 'sdkwork-official', 'SDKWork 官方',
        'official-indie-welcome', 'announcement',
        '欢迎加入独立开发者聚集地',
        '一人公司、出海经验、变现思路与技术选型，和独立开发者们一起把想法变成产品。',
        'approved', TRUE, TRUE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-llm-welcome', '100001',
        'community-circle-official-llm-advanced', 'sdkwork-official', 'SDKWork 官方',
        'official-llm-welcome', 'announcement',
        '欢迎加入 AI 大模型实战进阶圈',
        '大模型应用开发、RAG 架构、微调与 Agent 编排的深度实战内容已就绪，进阶从这里开始。',
        'approved', TRUE, TRUE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-aigc-welcome', '100001',
        'community-circle-official-aigc-creation', 'sdkwork-official', 'SDKWork 官方',
        'official-aigc-welcome', 'announcement',
        '欢迎加入 AIGC 创作训练营',
        '提示词工程、AI 绘画、AI 视频与内容创作的实战训练内容已上线，一起创作属于你的作品。',
        'approved', TRUE, TRUE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-ai-product-welcome', '100001',
        'community-circle-official-ai-product', 'sdkwork-official', 'SDKWork 官方',
        'official-ai-product-welcome', 'announcement',
        '欢迎加入 AI 产品经理实战圈',
        'AI 产品设计、需求洞察、商业化路径与落地案例持续更新，与 AI 产品同行共同成长。',
        'approved', TRUE, TRUE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    author_id = EXCLUDED.author_id,
    author_name = EXCLUDED.author_name,
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    review_state = EXCLUDED.review_state,
    is_featured = EXCLUDED.is_featured,
    is_pinned = EXCLUDED.is_pinned,
    published_at = EXCLUDED.published_at,
    last_activity_at = EXCLUDED.last_activity_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO community_entry_body (entry_id, body_markdown, body_format, content_checksum, updated_at)
VALUES
    (
        'community-entry-official-ai-learning-welcome',
        '欢迎加入 **官方 AI 学习圈**！\n\n这里汇聚了 AI 入门到进阶的系统内容：\n\n- 零基础 AI 学习路线与精选课程\n- 机器学习与深度学习核心知识\n- 大模型应用开发实战案例\n- 官方团队答疑与学习交流\n\n祝你在 AI 学习中收获满满！',
        'markdown', NULL, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-ai-learning-roadmap',
        '## AI 学习路线（四阶段）\n\n1. **基础理论**：数学基础、Python 编程\n2. **机器学习**：监督学习、无监督学习、经典算法\n3. **深度学习**：神经网络、CNN/RNN/Transformer\n4. **大模型应用**：Prompt、RAG、微调、Agent\n\n每阶段配套官方推荐资源与练习项目，按自己的节奏学习即可。',
        'markdown', NULL, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-announcements-welcome',
        '欢迎关注 **官方公告圈**！\n\n产品更新、功能上线、活动通知与使用指南都会在这里第一时间发布。\n\n建议开启消息提醒，不要错过重要动态。',
        'markdown', NULL, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-product-welcome',
        '欢迎加入 **产品经理交流圈**！\n\n这里分享产品方法论、需求分析、增长与商业化实战内容，也欢迎你发布自己的实践与思考。',
        'markdown', NULL, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-indie-welcome',
        '欢迎加入 **独立开发者聚集地**！\n\n一人公司经验、出海策略、变现思路与技术选型，在这里与独立开发者们一起交流成长。',
        'markdown', NULL, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-llm-welcome',
        '欢迎加入 **AI 大模型实战进阶圈**！\n\n本圈为付费专业圈，提供大模型应用开发、RAG 架构、微调评估与 Agent 编排的深度实战内容，适合有基础的开发者持续进阶。',
        'markdown', NULL, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-aigc-welcome',
        '欢迎加入 **AIGC 创作训练营**！\n\n提示词工程、AI 绘画、AI 视频与内容创作的实战训练内容已上线，跟随官方课程一步步创作属于你的作品。',
        'markdown', NULL, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-ai-product-welcome',
        '欢迎加入 **AI 产品经理实战圈**！\n\nAI 产品设计、需求洞察、商业化路径与落地案例持续更新，与 AI 产品同行共同成长。',
        'markdown', NULL, CURRENT_TIMESTAMP
    )
ON CONFLICT (entry_id) DO UPDATE SET
    body_markdown = EXCLUDED.body_markdown,
    body_format = EXCLUDED.body_format,
    updated_at = EXCLUDED.updated_at;

INSERT INTO community_entry_tag (entry_id, tag_id)
VALUES
    ('community-entry-official-ai-learning-welcome', 'community-tag-official-welcome'),
    ('community-entry-official-ai-learning-welcome', 'community-tag-official-course'),
    ('community-entry-official-ai-learning-roadmap', 'community-tag-official-course'),
    ('community-entry-official-announcements-welcome', 'community-tag-official-news'),
    ('community-entry-official-product-welcome', 'community-tag-official-product'),
    ('community-entry-official-indie-welcome', 'community-tag-official-indie'),
    ('community-entry-official-llm-welcome', 'community-tag-official-llm'),
    ('community-entry-official-aigc-welcome', 'community-tag-official-aigc'),
    ('community-entry-official-ai-product-welcome', 'community-tag-official-ai-product')
ON CONFLICT (entry_id, tag_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Official groups (community_group): one WeChat group per circle
-- ---------------------------------------------------------------------------
INSERT INTO community_group (
    id, tenant_id, category_id, name, platform, description, member_count,
    qr_codes, created_at, updated_at
)
SELECT
    'community-group-' || community_category.id || '-official-wechat',
    '100001',
    community_category.id,
    community_category.title || '官方交流群',
    'wechat',
    community_category.title || '的官方微信交流群，扫码加入与官方团队和其他成员交流。',
    1,
    '[]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM community_category
WHERE tenant_id = '100001'
  AND owner_id = 'sdkwork-official'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at;

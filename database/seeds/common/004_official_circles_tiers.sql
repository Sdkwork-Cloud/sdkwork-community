-- Official circle membership tiers (会员等级) and two new official circles.
--
-- New circles: SDKWORK智能云天使投资群 (paid, from ¥9999/year) and
-- 人工智能私董会 (paid, from ¥2999/year). Every official paid circle ships
-- with three membership tiers (普通/高级/VIP style). Tiers are seeded
-- UNPUBLISHED (enabled = FALSE, catalog_package_id = NULL): the circle owner
-- publishes them from the management page, which registers the purchasable
-- membership package through the backend (sdkwork-order `packageId`).

-- ---------------------------------------------------------------------------
-- 1. New official circles (community_category)
-- ---------------------------------------------------------------------------
INSERT INTO community_category (
    id, tenant_id, slug, title, description, cover_image, avatar, owner_id,
    member_count, post_count, is_paid, price, tags, priority, enabled,
    created_at, updated_at
)
VALUES
    (
        'community-circle-official-angel-investment', '100001', 'official-angel-investment',
        'SDKWORK智能云天使投资群',
        '官方天使投资圈层：聚焦 AI 与智能云赛道的早期项目研判、投资逻辑、行业情报与路演对接，链接创业者与投资人。',
        'https://cdn.sdkwork.com/community/circles/official-angel-investment-cover.png',
        'https://cdn.sdkwork.com/community/circles/official-angel-investment-avatar.png',
        'sdkwork-official', 1, 1, TRUE, 9999,
        ARRAY['投资', 'AI 创业', '天使投资', '官方'], 35, TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-circle-official-ai-board', '100001', 'official-ai-board',
        '人工智能私董会',
        '官方高端私董圈层：AI 高管决策、战略闭门研讨、资源对接与深度陪伴，面向企业决策者与行业领军人物。',
        'https://cdn.sdkwork.com/community/circles/official-ai-board-cover.png',
        'https://cdn.sdkwork.com/community/circles/official-ai-board-avatar.png',
        'sdkwork-official', 1, 1, TRUE, 2999,
        ARRAY['私董会', '高管', 'AI 战略', '官方'], 30, TRUE,
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
--    (covers both new circles; existing ones are idempotent)
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
WHERE community_category.tenant_id = '100001'
  AND community_category.owner_id = 'sdkwork-official'
ON CONFLICT (tenant_id, category_id, user_id) DO UPDATE SET
    user_name = EXCLUDED.user_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    bio = EXCLUDED.bio,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 3. Official welcome entries for the new circles
-- ---------------------------------------------------------------------------
INSERT INTO community_entry (
    id, tenant_id, category_id, author_id, author_name, slug, kind, title,
    excerpt, review_state, is_featured, is_pinned, has_accepted_answer,
    comment_count, reaction_count, share_count, view_count,
    published_at, last_activity_at, created_at, updated_at
)
VALUES
    (
        'community-entry-official-angel-investment-welcome', '100001',
        'community-circle-official-angel-investment', 'sdkwork-official', 'SDKWork 官方',
        'official-angel-investment-welcome', 'announcement',
        '欢迎加入 SDKWORK智能云天使投资群',
        'AI 与智能云赛道的早期项目研判、投资逻辑与行业情报持续更新，欢迎创业者与投资人交流。',
        'approved', TRUE, TRUE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-ai-board-welcome', '100001',
        'community-circle-official-ai-board', 'sdkwork-official', 'SDKWork 官方',
        'official-ai-board-welcome', 'announcement',
        '欢迎加入人工智能私董会',
        'AI 高管决策、战略闭门研讨与资源对接的深度圈层，与行业领军人物共同成长。',
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
        'community-entry-official-angel-investment-welcome',
        '欢迎加入 **SDKWORK智能云天使投资群**！\n\n这里聚焦 AI 与智能云赛道的早期投资：\n\n- 早期项目研判与投资逻辑\n- 行业情报与赛道分析\n- 创业路演与投资对接\n\n购买会员后即可查看全部内容并加入官方交流群。',
        'markdown', NULL, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-ai-board-welcome',
        '欢迎加入 **人工智能私董会**！\n\n面向企业决策者与行业领军人物的高端圈层：\n\n- AI 战略闭门研讨\n- 高管决策实战案例\n- 资源对接与深度陪伴\n\n购买会员后即可解锁全部权益。',
        'markdown', NULL, CURRENT_TIMESTAMP
    )
ON CONFLICT (entry_id) DO UPDATE SET
    body_markdown = EXCLUDED.body_markdown,
    body_format = EXCLUDED.body_format,
    updated_at = EXCLUDED.updated_at;

INSERT INTO community_entry_tag (entry_id, tag_id)
VALUES
    ('community-entry-official-angel-investment-welcome', 'community-tag-official-welcome'),
    ('community-entry-official-ai-board-welcome', 'community-tag-official-welcome')
ON CONFLICT (entry_id, tag_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Official groups for the new circles
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
WHERE community_category.tenant_id = '100001'
  AND community_category.owner_id = 'sdkwork-official'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 5. Membership tiers for the five official paid circles
--    (unpublished; the owner publishes from the management page)
-- ---------------------------------------------------------------------------
INSERT INTO community_membership_tier (
    id, tenant_id, category_id, name, description, price, duration_days,
    benefits, catalog_package_id, sort_order, enabled, created_at, updated_at
)
VALUES
    -- AI 大模型实战进阶（付费）
    ('community-tier-official-llm-standard', '100001', 'community-circle-official-llm-advanced',
     '普通会员', '圈子全部内容与官方交流群', 199, 365,
     '["圈子全部内容", "官方交流群"]', NULL, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-llm-plus', '100001', 'community-circle-official-llm-advanced',
     '高级会员', '普通会员权益 + 专题课程与源码资料', 399, 365,
     '["圈子全部内容", "官方交流群", "专题课程", "源码资料"]', NULL, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-llm-vip', '100001', 'community-circle-official-llm-advanced',
     'VIP 会员', '高级会员权益 + 月度直播答疑与 1v1 咨询', 799, 365,
     '["圈子全部内容", "官方交流群", "专题课程", "源码资料", "月度直播答疑", "1v1 咨询"]', NULL, 3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- AIGC 创作训练营（付费）
    ('community-tier-official-aigc-standard', '100001', 'community-circle-official-aigc-creation',
     '普通会员', '圈子全部内容与官方交流群', 99, 365,
     '["圈子全部内容", "官方交流群"]', NULL, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-aigc-plus', '100001', 'community-circle-official-aigc-creation',
     '高级会员', '普通会员权益 + 实战案例与模板库', 199, 365,
     '["圈子全部内容", "官方交流群", "实战案例", "模板库"]', NULL, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-aigc-vip', '100001', 'community-circle-official-aigc-creation',
     'VIP 会员', '高级会员权益 + 作品点评与专属训练营', 399, 365,
     '["圈子全部内容", "官方交流群", "实战案例", "模板库", "作品点评", "专属训练营"]', NULL, 3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- AI 产品经理实战（付费）
    ('community-tier-official-ai-product-standard', '100001', 'community-circle-official-ai-product',
     '普通会员', '圈子全部内容与官方交流群', 99, 365,
     '["圈子全部内容", "官方交流群"]', NULL, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-ai-product-plus', '100001', 'community-circle-official-ai-product',
     '高级会员', '普通会员权益 + 案例拆解与模板', 199, 365,
     '["圈子全部内容", "官方交流群", "案例拆解", "模板"]', NULL, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-ai-product-vip', '100001', 'community-circle-official-ai-product',
     'VIP 会员', '高级会员权益 + 简历点评与内推机会', 399, 365,
     '["圈子全部内容", "官方交流群", "案例拆解", "模板", "简历点评", "内推机会"]', NULL, 3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- SDKWORK智能云天使投资群
    ('community-tier-official-angel-standard', '100001', 'community-circle-official-angel-investment',
     '普通会员', '圈子全部内容与官方交流群', 9999, 365,
     '["圈子全部内容", "官方交流群", "行业情报"]', NULL, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-angel-plus', '100001', 'community-circle-official-angel-investment',
     '高级会员', '普通会员权益 + 项目研判与路演回放', 19999, 365,
     '["圈子全部内容", "官方交流群", "行业情报", "项目研判", "路演回放"]', NULL, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-angel-vip', '100001', 'community-circle-official-angel-investment',
     '董事会员', '高级会员权益 + 线下闭门交流与项目对接', 39999, 365,
     '["圈子全部内容", "官方交流群", "行业情报", "项目研判", "路演回放", "线下闭门交流", "项目对接"]', NULL, 3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-angel-partner', '100001', 'community-circle-official-angel-investment',
     '合伙人', '董事会员权益 + 一对一投融资咨询与季度尽调报告', 59999, 365,
     '["圈子全部内容", "官方交流群", "行业情报", "项目研判", "路演回放", "线下闭门交流", "项目对接", "一对一投融资咨询", "季度尽调报告"]', NULL, 4, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-angel-founding-partner', '100001', 'community-circle-official-angel-investment',
     '创始合伙人', '合伙人权益 + 年度投资峰会席位与联合投资机会', 99999, 365,
     '["圈子全部内容", "官方交流群", "行业情报", "项目研判", "路演回放", "线下闭门交流", "项目对接", "一对一投融资咨询", "季度尽调报告", "年度投资峰会席位", "联合投资机会"]', NULL, 5, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 人工智能私董会
    ('community-tier-official-board-member', '100001', 'community-circle-official-ai-board',
     '私董成员', '圈子全部内容与官方交流群', 2999, 365,
     '["圈子全部内容", "官方交流群", "闭门研讨"]', NULL, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-board-senior', '100001', 'community-circle-official-ai-board',
     '高级私董', '私董成员权益 + 战略案例与专属顾问', 5999, 365,
     '["圈子全部内容", "官方交流群", "闭门研讨", "战略案例", "专属顾问"]', NULL, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-board-chief', '100001', 'community-circle-official-ai-board',
     '首席私董', '高级私董权益 + 年度私董晚宴与深度资源对接', 9999, 365,
     '["圈子全部内容", "官方交流群", "闭门研讨", "战略案例", "专属顾问", "年度私董晚宴", "深度资源对接"]', NULL, 3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_days = EXCLUDED.duration_days,
    benefits = EXCLUDED.benefits,
    sort_order = EXCLUDED.sort_order,
    updated_at = EXCLUDED.updated_at;

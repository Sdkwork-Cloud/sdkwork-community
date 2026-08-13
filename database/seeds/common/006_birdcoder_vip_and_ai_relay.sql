-- Official paid circles: Birdcoder VIP circle and AI relay-station alliance.
--
-- New circles: Birdcoder VIP会员圈 (paid, from ¥199/year) and
-- 人工智能AI中转站联盟 (paid, from ¥299/year). Every official paid circle ships
-- with three membership tiers (普通/高级/VIP style). Tiers are seeded
-- UNPUBLISHED (enabled = FALSE, catalog_package_id = NULL): the community
-- service startup bootstrap publishes official tiers (registers the
-- purchasable membership package through the backend) so the purchase
-- surface is ready to use.

-- ---------------------------------------------------------------------------
-- 1. New official circles (community_category)
-- ---------------------------------------------------------------------------
INSERT INTO community_category (
    id, tenant_id, slug, title, description, cover_image, avatar, owner_id,
    member_count, post_count, is_paid, price, tags, priority, enabled,
    is_recommended, created_at, updated_at
)
VALUES
    (
        'community-circle-official-birdcoder-vip', '100001', 'official-birdcoder-vip',
        'Birdcoder VIP会员圈',
        'Birdcoder 官方 VIP 圈层：源码深度解析、技术直播答疑、1v1 咨询与内推变现指导，与资深开发者一起进阶。',
        'https://placehold.co/800x400/0891b2/ffffff/png?text=Birdcoder+VIP',
        'https://api.dicebear.com/7.x/initials/png?seed=Birdcoder+VIP&backgroundColor=0891b2',
        'sdkwork-official', 1, 1, TRUE, 199,
        ARRAY['VIP', '源码解析', '技术进阶', '官方'], 85, TRUE, TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-circle-official-ai-relay', '100001', 'official-ai-relay',
        '人工智能AI中转站联盟',
        '官方 AI 中转站联盟圈层：上游渠道资源对接、报价情报与联合采购，链接中转站运营者与技术团队。',
        'https://placehold.co/800x400/d97706/ffffff/png?text=AI+Relay',
        'https://api.dicebear.com/7.x/initials/png?seed=AI+Relay&backgroundColor=d97706',
        'sdkwork-official', 1, 1, TRUE, 19999,
        ARRAY['AI 中转', '渠道', '联盟', '官方'], 75, TRUE, TRUE,
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
    is_recommended = EXCLUDED.is_recommended,
    enabled = EXCLUDED.enabled,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 2. Official membership (community_member): owner of the new circles
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
  AND community_category.id IN (
      'community-circle-official-birdcoder-vip',
      'community-circle-official-ai-relay'
  )
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
        'community-entry-official-birdcoder-vip-welcome', '100001',
        'community-circle-official-birdcoder-vip', 'sdkwork-official', 'SDKWork 官方',
        'official-birdcoder-vip-welcome', 'announcement',
        '欢迎加入 Birdcoder VIP会员圈',
        '源码深度解析、技术直播答疑、1v1 咨询与内推变现指导，与资深开发者一起进阶。',
        'approved', TRUE, TRUE, FALSE, 0, 0, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-ai-relay-welcome', '100001',
        'community-circle-official-ai-relay', 'sdkwork-official', 'SDKWork 官方',
        'official-ai-relay-welcome', 'announcement',
        '欢迎加入 人工智能AI中转站联盟',
        '上游渠道资源对接、报价情报与联合采购，与中转站运营者共同拓展 AI 生意。',
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
        'community-entry-official-birdcoder-vip-welcome',
        '欢迎加入 **Birdcoder VIP会员圈**！\n\n面向进阶开发者的官方 VIP 圈层：\n\n- 源码深度解析与实战拆解\n- 技术直播答疑与月度闭门交流\n- 1v1 技术咨询与职业指导\n- 内推机会与变现路径指导\n\n购买会员后即可查看全部内容并加入官方交流群。',
        'markdown', NULL, CURRENT_TIMESTAMP
    ),
    (
        'community-entry-official-ai-relay-welcome',
        '欢迎加入 **人工智能AI中转站联盟**！\n\n链接 AI 中转站运营者与技术团队的官方联盟，五个版本能力递进：\n\n- **联盟成员** ¥19999/年：圈子全部内容、官方交流群、行业报价情报\n- **高级成员** ¥39999/年：+ 上游渠道资源对接、联合采购、月度闭门交流会\n- **核心成员** ¥79999/年：+ 专属客户经理、平台技术对接支持、季度运营报告\n- **战略伙伴** ¥129999/年：+ 联合营销资源、区域渠道保护、年度峰会发言席位\n- **创始伙伴** ¥199999/年：+ 定制渠道方案、联合研发、1v1 战略咨询、创始荣誉身份\n\n购买会员后即可解锁对应版本全部权益。',
        'markdown', NULL, CURRENT_TIMESTAMP
    )
ON CONFLICT (entry_id) DO UPDATE SET
    body_markdown = EXCLUDED.body_markdown,
    body_format = EXCLUDED.body_format,
    updated_at = EXCLUDED.updated_at;

INSERT INTO community_entry_tag (entry_id, tag_id)
VALUES
    ('community-entry-official-birdcoder-vip-welcome', 'community-tag-official-welcome'),
    ('community-entry-official-ai-relay-welcome', 'community-tag-official-welcome')
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
  AND community_category.id IN (
      'community-circle-official-birdcoder-vip',
      'community-circle-official-ai-relay'
  )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 5. Membership tiers for the new paid circles
--    (unpublished; the startup bootstrap publishes official tiers)
-- ---------------------------------------------------------------------------
INSERT INTO community_membership_tier (
    id, tenant_id, category_id, name, description, price, duration_days,
    benefits, catalog_package_id, sort_order, enabled, created_at, updated_at
)
VALUES
    -- Birdcoder VIP会员圈
    ('community-tier-official-birdcoder-standard', '100001', 'community-circle-official-birdcoder-vip',
     '普通会员', '圈子全部内容与官方交流群', 199, 365,
     '["圈子全部内容", "官方交流群", "代码资源库"]', NULL, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-birdcoder-plus', '100001', 'community-circle-official-birdcoder-vip',
     '高级会员', '普通会员权益 + 源码解析与月度直播答疑', 399, 365,
     '["圈子全部内容", "官方交流群", "代码资源库", "源码深度解析", "月度直播答疑"]', NULL, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-birdcoder-vip', '100001', 'community-circle-official-birdcoder-vip',
     'VIP 会员', '高级会员权益 + 1v1 技术咨询与内推指导', 799, 365,
     '["圈子全部内容", "官方交流群", "代码资源库", "源码深度解析", "月度直播答疑", "1v1 技术咨询", "内推与变现指导"]', NULL, 3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 人工智能AI中转站联盟
    ('community-tier-official-relay-member', '100001', 'community-circle-official-ai-relay',
     '联盟成员', '版本 L1：圈子全部内容、官方交流群与行业报价情报', 19999, 365,
     '["圈子全部内容", "官方交流群", "行业报价情报"]', NULL, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-relay-senior', '100001', 'community-circle-official-ai-relay',
     '高级成员', '版本 L2：联盟成员权益 + 上游渠道对接与联合采购', 39999, 365,
     '["圈子全部内容", "官方交流群", "行业报价情报", "上游渠道资源对接", "联合采购", "月度闭门交流会"]', NULL, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-relay-core', '100001', 'community-circle-official-ai-relay',
     '核心成员', '版本 L3：高级成员权益 + 专属客户经理与技术对接', 79999, 365,
     '["圈子全部内容", "官方交流群", "行业报价情报", "上游渠道资源对接", "联合采购", "月度闭门交流会", "专属客户经理", "平台技术对接支持", "季度运营报告"]', NULL, 3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-relay-strategic', '100001', 'community-circle-official-ai-relay',
     '战略伙伴', '版本 L4：核心成员权益 + 联合营销与区域渠道保护', 129999, 365,
     '["圈子全部内容", "官方交流群", "行业报价情报", "上游渠道资源对接", "联合采购", "月度闭门交流会", "专属客户经理", "平台技术对接支持", "季度运营报告", "联合营销资源", "区域渠道保护", "年度峰会发言席位"]', NULL, 4, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-relay-founding', '100001', 'community-circle-official-ai-relay',
     '创始伙伴', '版本 L5：战略伙伴权益 + 定制方案与联合研发', 199999, 365,
     '["圈子全部内容", "官方交流群", "行业报价情报", "上游渠道资源对接", "联合采购", "月度闭门交流会", "专属客户经理", "平台技术对接支持", "季度运营报告", "联合营销资源", "区域渠道保护", "年度峰会发言席位", "定制渠道方案", "联合研发", "1v1 战略咨询", "创始荣誉身份"]', NULL, 5, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_days = EXCLUDED.duration_days,
    benefits = EXCLUDED.benefits,
    sort_order = EXCLUDED.sort_order,
    updated_at = EXCLUDED.updated_at;

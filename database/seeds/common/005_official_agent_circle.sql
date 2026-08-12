-- Official agent (代理商) circle for sdkwork-community.
--
-- Buying into this circle grants an agent qualification at the purchased
-- tier level (agent_level). Four agent tiers form the marketing/operations
-- price ladder; every tier offers a yearly and a lifetime price (同档双价).
--
-- Tiers are seeded UNPUBLISHED (enabled = FALSE): the community service
-- startup bootstrap publishes official tiers (yearly + lifetime packages)
-- through the membership backend, so the purchase surface is ready to use.

-- ---------------------------------------------------------------------------
-- 1. Agent circle (community_category)
-- ---------------------------------------------------------------------------
INSERT INTO community_category (
    id, tenant_id, slug, title, description, cover_image, avatar, owner_id,
    member_count, post_count, is_paid, price, tags, priority, enabled,
    is_agent_circle, is_recommended, created_at, updated_at
)
VALUES
    (
        'community-circle-official-agent', '100001', 'official-agent',
        'SDKWork 代理商圈',
        '官方代理商圈子：购买会员即获得代理商资格，等级随档位提升。享受产品折扣、专属扶持、联合营销与年度峰会，与 SDKWork 一起拓展智能云生意。',
        'https://placehold.co/800x400/6366f1/ffffff/png?text=SDKWork+Agent',
        'https://api.dicebear.com/7.x/initials/png?seed=Agent&backgroundColor=6366f1',
        'sdkwork-official', 1, 1, TRUE, 999,
        ARRAY['代理商', '渠道', '官方'], 100, TRUE,
        TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    cover_image = EXCLUDED.cover_image,
    avatar = EXCLUDED.avatar,
    owner_id = EXCLUDED.owner_id,
    is_paid = EXCLUDED.is_paid,
    price = EXCLUDED.price,
    tags = EXCLUDED.tags,
    priority = EXCLUDED.priority,
    is_agent_circle = EXCLUDED.is_agent_circle,
    is_recommended = EXCLUDED.is_recommended,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 2. Official owner membership
-- ---------------------------------------------------------------------------
INSERT INTO community_member (
    id, tenant_id, category_id, user_id, user_name, role, status, bio,
    joined_at, created_at, updated_at
)
SELECT
    'community-member-community-circle-official-agent-official-owner',
    '100001',
    community_category.id,
    'sdkwork-official',
    'SDKWork 官方',
    'owner',
    'active',
    'SDKWork 官方团队，负责代理商体系的运营、扶持与答疑。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM community_category
WHERE tenant_id = '100001'
  AND id = 'community-circle-official-agent'
ON CONFLICT (tenant_id, category_id, user_id) DO UPDATE SET
    user_name = EXCLUDED.user_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    bio = EXCLUDED.bio,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 3. Agent tiers (会员等级 → 代理商等级), yearly + lifetime price
-- ---------------------------------------------------------------------------
INSERT INTO community_membership_tier (
    id, tenant_id, category_id, name, description, price, duration_days,
    lifetime_price, benefits, agent_level, catalog_package_id, sort_order,
    enabled, created_at, updated_at
)
VALUES
    ('community-tier-official-agent-distributor', '100001', 'community-circle-official-agent',
     '初级代理', 'L1 层级：代理个人版会员与标准课程，佣金 15%', 5999, 365, 15999,
     '["代理商资格", "L1 产品线：个人版会员、标准课程", "佣金比例 15%", "9 折进货", "官方资源包"]', 'distributor', NULL, 1,
     FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-agent-silver', '100001', 'community-circle-official-agent',
     '银牌代理', 'L2 层级：含团队版与进阶课程，佣金 20%', 12999, 365, 32999,
     '["初级代理全部权益", "L2 产品线：团队版、进阶课程、训练营", "佣金比例 20%", "85 折进货", "专属销售培训"]', 'silver', NULL, 2,
     FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-agent-gold', '100001', 'community-circle-official-agent',
     '金牌代理', 'L3 层级：含企业版与 AI 解决方案，佣金 25%', 25999, 365, 65999,
     '["银牌代理全部权益", "L3 产品线：企业版、AI 解决方案", "佣金比例 25%", "8 折进货", "区域保护", "1v1 业务扶持"]', 'gold', NULL, 3,
     FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('community-tier-official-agent-platinum', '100001', 'community-circle-official-agent',
     '铂金代理', 'L4 层级：含定制方案与联合研发，佣金 30%', 49999, 365, 129999,
     '["金牌代理全部权益", "L4 产品线：定制方案、联合研发", "佣金比例 30%", "75 折进货", "专属客户经理", "年度代理商峰会"]', 'platinum', NULL, 4,
     FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_days = EXCLUDED.duration_days,
    lifetime_price = EXCLUDED.lifetime_price,
    benefits = EXCLUDED.benefits,
    agent_level = EXCLUDED.agent_level,
    sort_order = EXCLUDED.sort_order,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 4. Official welcome entry
-- ---------------------------------------------------------------------------
INSERT INTO community_entry (
    id, tenant_id, category_id, author_id, author_name, slug, kind, title,
    excerpt, review_state, is_featured, is_pinned, has_accepted_answer,
    comment_count, reaction_count, share_count, view_count,
    published_at, last_activity_at, created_at, updated_at
)
VALUES
    (
        'community-entry-official-agent-welcome', '100001',
        'community-circle-official-agent', 'sdkwork-official', 'SDKWork 官方',
        'official-agent-welcome', 'announcement',
        '欢迎加入 SDKWork 代理商圈',
        '购买会员即可获得对应等级的代理商资格：产品折扣、专属扶持、联合营销与年度峰会。',
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
        'community-entry-official-agent-welcome',
        '欢迎加入 **SDKWork 代理商圈**！\n\n购买会员即可获得对应等级的代理商资格：\n\n- **初级代理** ¥5999/年（终身 ¥15999）：L1 产品线（个人版/标准课程）、佣金 15%、9 折\n- **银牌代理** ¥12999/年（终身 ¥32999）：L2 产品线（团队版/进阶课程）、佣金 20%、85 折\n- **金牌代理** ¥25999/年（终身 ¥65999）：L3 产品线（企业版/AI 方案）、佣金 25%、8 折\n- **铂金代理** ¥49999/年（终身 ¥129999）：L4 产品线（定制/联合研发）、佣金 30%、75 折\n\n等级随档位升级，权益逐级叠加。',
        'markdown', NULL, CURRENT_TIMESTAMP
    )
ON CONFLICT (entry_id) DO UPDATE SET
    body_markdown = EXCLUDED.body_markdown,
    body_format = EXCLUDED.body_format,
    updated_at = EXCLUDED.updated_at;

-- ---------------------------------------------------------------------------
-- 5. Official agent group
-- ---------------------------------------------------------------------------
INSERT INTO community_group (
    id, tenant_id, category_id, name, platform, description, member_count,
    qr_codes, created_at, updated_at
)
VALUES
    (
        'community-group-official-agent-wechat', '100001',
        'community-circle-official-agent', '代理商官方群', 'wechat',
        '代理商交流与官方扶持群，入圈后可申请进群。', 0,
        '[]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    platform = EXCLUDED.platform,
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at;

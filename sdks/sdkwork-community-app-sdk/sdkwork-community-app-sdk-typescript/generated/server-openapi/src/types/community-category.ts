export interface CommunityCategory {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  avatar?: string;
  ownerId?: string;
  memberCount: string;
  memberLimit?: string;
  postCount: string;
  isPaid: boolean;
  price?: number;
  tags: string[];
  priority: number;
  enabled: boolean;
}

export interface CommunityCategory {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description?: string;
  priority: number;
  enabled: boolean;
}

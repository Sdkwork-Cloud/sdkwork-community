export interface CommunityMembershipTier {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  durationDays: string;
  benefits: string[];
  catalogPackageId?: string;
  sortOrder: string;
  enabled: boolean;
}

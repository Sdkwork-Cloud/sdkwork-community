export interface CommunityMemberResponse {
  id: string;
  tenantId: string;
  categoryId: string;
  userId: string;
  userName: string;
  role: string;
  status: string;
  bio?: string;
  joinedAt: string;
}

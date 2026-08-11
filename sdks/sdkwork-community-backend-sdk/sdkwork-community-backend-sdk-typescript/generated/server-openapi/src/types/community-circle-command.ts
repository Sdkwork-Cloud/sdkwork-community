export interface CommunityCircleCommand {
  title: string;
  description?: string;
  coverImage?: string;
  avatar?: string;
  isPaid?: boolean;
  memberLimit?: string;
  price?: number;
  tags?: string[];
}

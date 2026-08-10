export interface CommunityCircleCommand {
  title: string;
  description?: string;
  coverImage?: string;
  avatar?: string;
  isPaid?: boolean;
  price?: number;
  tags?: string[];
}

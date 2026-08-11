export interface CommunityTierCommand {
  name: string;
  description?: string;
  price: number;
  durationDays?: string;
  benefits?: string[];
  sortOrder?: string;
}

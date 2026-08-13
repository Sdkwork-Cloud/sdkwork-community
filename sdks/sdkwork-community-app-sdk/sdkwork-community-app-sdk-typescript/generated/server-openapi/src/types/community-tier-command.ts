export interface CommunityTierCommand {
  name: string;
  description?: string;
  price: number;
  durationDays?: string;
  lifetimePrice?: number;
  benefits?: string[];
  agentLevel?: string;
  sortOrder?: string;
}

import type { CommunityReviewState } from './community-review-state';

export interface CommunityModerationCommand {
  reviewState: CommunityReviewState;
  reason?: string;
}

import type { SdkworkCommunityEntry } from "@sdkwork/community-contracts";
import type { SdkworkCommunityAppSdkPort, SdkworkCommunityListParams } from "@sdkwork/community-sdk-ports";

export interface SdkworkCommunityService {
  listFeed(params?: SdkworkCommunityListParams): Promise<SdkworkCommunityEntry[]>;
  retrieveEntry(entryId: string): Promise<SdkworkCommunityEntry>;
}

export function createSdkworkCommunityService(client: SdkworkCommunityAppSdkPort): SdkworkCommunityService {
  return {
    async listFeed(params = {}) {
      const response = await client.community.feed.list(params);
      return response.data;
    },
    async retrieveEntry(entryId) {
      const response = await client.community.entries.retrieve(entryId);
      return response.data;
    },
  };
}

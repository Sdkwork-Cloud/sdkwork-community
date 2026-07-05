import type { SdkworkCommunityComment, SdkworkCommunityEntry } from "@sdkwork/community-contracts";
import type { SdkworkCommunityAppSdkPort, SdkworkCommunityListParams } from "@sdkwork/community-sdk-ports";
import { isBlank, trim } from "@sdkwork/utils";

export interface SdkworkCommunityService {
  createComment(entryId: string, body: string): Promise<SdkworkCommunityComment>;
  listComments(entryId: string): Promise<readonly SdkworkCommunityComment[]>;
  listFeed(params?: SdkworkCommunityListParams): Promise<SdkworkCommunityEntry[]>;
  retrieveEntry(entryId: string): Promise<SdkworkCommunityEntry>;
}

export function createSdkworkCommunityService(client: SdkworkCommunityAppSdkPort): SdkworkCommunityService {
  return {
    async listFeed(params = {}) {
      return client.community.feed.list(params);
    },
    async retrieveEntry(entryId) {
      return client.community.entries.retrieve(entryId);
    },
    async listComments(entryId) {
      return client.community.comments.list(entryId);
    },
    async createComment(entryId, body) {
      const normalized = trim(body);
      if (isBlank(normalized)) {
        throw new Error("community comment body is required");
      }
      return client.community.comments.create(entryId, { body: normalized });
    },
  };
}

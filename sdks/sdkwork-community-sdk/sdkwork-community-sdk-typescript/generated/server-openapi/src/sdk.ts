import { HttpClient, createHttpClient } from './http/client';
import type { SdkworkCustomConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import { CategoryApi, createCategoryApi } from './api/category';
import { FeedApi, createFeedApi } from './api/feed';
import { EntryApi, createEntryApi } from './api/entry';

export class SdkworkCustomClient {
  private httpClient: HttpClient;

  public readonly category: CategoryApi;
  public readonly feed: FeedApi;
  public readonly entry: EntryApi;

  constructor(config: SdkworkCustomConfig) {
    this.httpClient = createHttpClient(config);
    this.category = createCategoryApi(this.httpClient);

    this.feed = createFeedApi(this.httpClient);

    this.entry = createEntryApi(this.httpClient);
  }

  setApiKey(apiKey: string): this {
    this.httpClient.setApiKey(apiKey);
    return this;
  }

  setAuthToken(token: string): this {
    this.httpClient.setAuthToken(token);
    return this;
  }

  setAccessToken(token: string): this {
    this.httpClient.setAccessToken(token);
    return this;
  }

  setTokenManager(manager: AuthTokenManager): this {
    this.httpClient.setTokenManager(manager);
    return this;
  }

  get http(): HttpClient {
    return this.httpClient;
  }
}

export function createClient(config: SdkworkCustomConfig): SdkworkCustomClient {
  return new SdkworkCustomClient(config);
}

export default SdkworkCustomClient;

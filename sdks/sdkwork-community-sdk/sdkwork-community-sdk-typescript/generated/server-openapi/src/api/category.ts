import { customApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';

import type { SdkWorkListResponse } from '../types';


export class CategoryPublicApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Community categories.public.list */
  async list(requestOptions?: ApiRequestOptions): Promise<SdkWorkListResponse> {
    return this.client.request<SdkWorkListResponse>(customApiPath(`/categories`), { signal: requestOptions?.signal, timeout: requestOptions?.timeout, method: 'GET' as any });
  }
}

export class CategoryApi {
  private client: HttpClient;
  public readonly public: CategoryPublicApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.public = new CategoryPublicApi(client);
  }

}

export function createCategoryApi(client: HttpClient): CategoryApi {
  return new CategoryApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

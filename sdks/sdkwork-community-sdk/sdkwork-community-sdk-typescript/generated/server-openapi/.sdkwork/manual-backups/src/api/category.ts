import { customApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { CategoriesPublicListResponse } from '../types';


export class CategoryPublicApi {
  private client: HttpClient;
  
  constructor(client: HttpClient) { 
    this.client = client; 
  }


/** Community categories.public.list */
  async list(): Promise<CategoriesPublicListResponse> {
    return this.client.get<CategoriesPublicListResponse>(customApiPath(`/categories`));
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

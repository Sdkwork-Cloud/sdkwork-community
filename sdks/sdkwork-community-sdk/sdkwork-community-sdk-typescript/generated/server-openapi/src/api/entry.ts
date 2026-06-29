import { customApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { SdkWorkResourceResponse } from '../types';


export class EntryPublicBySlugApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Community entries.publicBySlug.retrieve */
  async retrieve(slug: string): Promise<SdkWorkResourceResponse> {
    return this.client.get<SdkWorkResourceResponse>(customApiPath(`/entries/by_slug/${serializePathParameter(slug, { name: 'slug', style: 'simple', explode: false })}`));
  }
}

export class EntryPublicApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Community entries.public.retrieve */
  async retrieve(entryId: string): Promise<SdkWorkResourceResponse> {
    return this.client.get<SdkWorkResourceResponse>(customApiPath(`/entries/${serializePathParameter(entryId, { name: 'entryId', style: 'simple', explode: false })}`));
  }
}

export class EntryApi {
  private client: HttpClient;
  public readonly public: EntryPublicApi;
  public readonly publicBySlug: EntryPublicBySlugApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.public = new EntryPublicApi(client);
    this.publicBySlug = new EntryPublicBySlugApi(client);
  }

}

export function createEntryApi(client: HttpClient): EntryApi {
  return new EntryApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

interface PathParameterSpec {
  name: string;
  style: string;
  explode: boolean;
}

function serializePathParameter(value: unknown, spec: PathParameterSpec): string {
  if (value === undefined || value === null) {
    return '';
  }

  const style = spec.style || 'simple';
  if (Array.isArray(value)) {
    return serializePathArray(spec.name, value, style, spec.explode);
  }
  if (typeof value === 'object') {
    return serializePathObject(spec.name, value as Record<string, unknown>, style, spec.explode);
  }
  return pathPrefix(spec.name, style, false) + encodePathValue(serializePathPrimitive(value));
}

function serializePathArray(name: string, values: unknown[], style: string, explode: boolean): string {
  const serialized = values
    .filter((item) => item !== undefined && item !== null)
    .map((item) => encodePathValue(serializePathPrimitive(item)));
  if (serialized.length === 0) {
    return pathPrefix(name, style, false);
  }
  if (style === 'matrix') {
    return explode
      ? serialized.map((item) => `;${name}=${item}`).join('')
      : `;${name}=${serialized.join(',')}`;
  }
  return pathPrefix(name, style, false) + serialized.join(explode ? '.' : ',');
}

function serializePathObject(name: string, value: Record<string, unknown>, style: string, explode: boolean): string {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return pathPrefix(name, style, true);
  }
  if (style === 'matrix') {
    return explode
      ? entries.map(([key, entryValue]) => `;${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join('')
      : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',')}`;
  }
  const serialized = explode
    ? entries.map(([key, entryValue]) => `${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join(style === 'label' ? '.' : ',')
    : entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
  return pathPrefix(name, style, true) + serialized;
}

function pathPrefix(name: string, style: string, _objectValue: boolean): string {
  if (style === 'label') return '.';
  if (style === 'matrix') return `;${name}`;
  return '';
}

function encodePathValue(value: string): string {
  return encodeURIComponent(value);
}

function serializePathPrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

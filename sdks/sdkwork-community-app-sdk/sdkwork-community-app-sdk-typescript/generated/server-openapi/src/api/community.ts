import { appApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { CommunityCommentCommand, CommunityEntryCommand, SdkWorkListResponse, SdkWorkResourceResponse } from '../types';


export class CommunityCommentsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Community comments.list */
  async list(entryId: string): Promise<SdkWorkListResponse> {
    return this.client.get<SdkWorkListResponse>(appApiPath(`/community/entries/${serializePathParameter(entryId, { name: 'entryId', style: 'simple', explode: false })}/comments`));
  }

/** Community comments.create */
  async create(entryId: string, body: CommunityCommentCommand): Promise<SdkWorkResourceResponse> {
    return this.client.post<SdkWorkResourceResponse>(appApiPath(`/community/entries/${serializePathParameter(entryId, { name: 'entryId', style: 'simple', explode: false })}/comments`), body, undefined, undefined, 'application/json');
  }
}

export class CommunityEntriesPublicationReadinessApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Community entries.publicationReadiness.retrieve */
  async retrieve(entryId: string): Promise<SdkWorkResourceResponse> {
    return this.client.get<SdkWorkResourceResponse>(appApiPath(`/community/entries/${serializePathParameter(entryId, { name: 'entryId', style: 'simple', explode: false })}/publication_readiness`));
  }
}

export class CommunityEntriesRecommendationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Community entries.recommendations.list */
  async list(entryId: string): Promise<SdkWorkListResponse> {
    return this.client.get<SdkWorkListResponse>(appApiPath(`/community/entries/${serializePathParameter(entryId, { name: 'entryId', style: 'simple', explode: false })}/recommendations`));
  }
}

export class CommunityEntriesApi {
  private client: HttpClient;
  public readonly recommendations: CommunityEntriesRecommendationsApi;
  public readonly publicationReadiness: CommunityEntriesPublicationReadinessApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.recommendations = new CommunityEntriesRecommendationsApi(client);
    this.publicationReadiness = new CommunityEntriesPublicationReadinessApi(client);
  }


/** Community entries.retrieve */
  async retrieve(entryId: string): Promise<SdkWorkResourceResponse> {
    return this.client.get<SdkWorkResourceResponse>(appApiPath(`/community/entries/${serializePathParameter(entryId, { name: 'entryId', style: 'simple', explode: false })}`));
  }

/** Community entries.update */
  async update(entryId: string, body: CommunityEntryCommand): Promise<SdkWorkResourceResponse> {
    return this.client.patch<SdkWorkResourceResponse>(appApiPath(`/community/entries/${serializePathParameter(entryId, { name: 'entryId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }

/** Community entries.create */
  async create(body: CommunityEntryCommand): Promise<SdkWorkResourceResponse> {
    return this.client.post<SdkWorkResourceResponse>(appApiPath(`/community/entries`), body, undefined, undefined, 'application/json');
  }
}

export interface CommunityFeedListParams {
  categoryId?: string;
  kind?: string;
  q?: string;
  reviewState?: string;
  tag?: string;
}

export class CommunityFeedApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Community feed.list */
  async list(params?: CommunityFeedListParams): Promise<SdkWorkListResponse> {
    const query = buildQueryString([
      { name: 'categoryId', value: params?.categoryId, style: 'form', explode: true, allowReserved: false },
      { name: 'kind', value: params?.kind, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'reviewState', value: params?.reviewState, style: 'form', explode: true, allowReserved: false },
      { name: 'tag', value: params?.tag, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<SdkWorkListResponse>(appendQueryString(appApiPath(`/community/feed`), query));
  }
}

export class CommunityCategoriesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Community categories.list */
  async list(): Promise<SdkWorkListResponse> {
    return this.client.get<SdkWorkListResponse>(appApiPath(`/community/categories`));
  }
}

export class CommunityApi {
  private client: HttpClient;
  public readonly categories: CommunityCategoriesApi;
  public readonly feed: CommunityFeedApi;
  public readonly entries: CommunityEntriesApi;
  public readonly comments: CommunityCommentsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.categories = new CommunityCategoriesApi(client);
    this.feed = new CommunityFeedApi(client);
    this.entries = new CommunityEntriesApi(client);
    this.comments = new CommunityCommentsApi(client);
  }

}

export function createCommunityApi(client: HttpClient): CommunityApi {
  return new CommunityApi(client);
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
interface QueryParameterSpec {
  name: string;
  value: unknown;
  style: string;
  explode: boolean;
  allowReserved: boolean;
  contentType?: string;
}

function buildQueryString(parameters: QueryParameterSpec[]): string {
  const pairs: string[] = [];
  for (const parameter of parameters) {
    appendSerializedParameter(pairs, parameter);
  }
  return pairs.join('&');
}

function appendSerializedParameter(pairs: string[], parameter: QueryParameterSpec): void {
  if (parameter.value === undefined || parameter.value === null) {
    return;
  }

  if (parameter.contentType) {
    pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(JSON.stringify(parameter.value), parameter.allowReserved)}`);
    return;
  }

  const style = parameter.style || 'form';
  if (style === 'deepObject') {
    appendDeepObjectParameter(pairs, parameter.name, parameter.value, parameter.allowReserved);
    return;
  }

  if (Array.isArray(parameter.value)) {
    appendArrayParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
    return;
  }

  if (typeof parameter.value === 'object') {
    appendObjectParameter(pairs, parameter.name, parameter.value as Record<string, unknown>, style, parameter.explode, parameter.allowReserved);
    return;
  }

  pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}

function appendArrayParameter(
  pairs: string[],
  name: string,
  value: unknown[],
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const values = value
    .filter((item) => item !== undefined && item !== null)
    .map((item) => serializePrimitive(item));
  if (values.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const item of values) {
      pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(item, allowReserved)}`);
    }
    return;
  }

  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(values.join(','), allowReserved)}`);
}

function appendObjectParameter(
  pairs: string[],
  name: string,
  value: Record<string, unknown>,
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const [key, entryValue] of entries) {
      pairs.push(`${encodeQueryComponent(key)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
    }
    return;
  }

  const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive(entryValue)]).join(',');
  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serialized, allowReserved)}`);
}

function appendDeepObjectParameter(
  pairs: string[],
  name: string,
  value: unknown,
  allowReserved: boolean,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
    return;
  }

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (entryValue === undefined || entryValue === null) {
      continue;
    }
    pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
  }
}

function serializePrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function encodeQueryComponent(value: string): string {
  return encodeURIComponent(value);
}

function encodeQueryValue(value: string, allowReserved: boolean): string {
  const encoded = encodeURIComponent(value);
  if (!allowReserved) {
    return encoded;
  }
  return encoded.replace(/%3A/gi, ':')
    .replace(/%2F/gi, '/')
    .replace(/%3F/gi, '?')
    .replace(/%23/gi, '#')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
    .replace(/%40/gi, '@')
    .replace(/%21/gi, '!')
    .replace(/%24/gi, '$')
    .replace(/%26/gi, '&')
    .replace(/%27/gi, "'")
    .replace(/%28/gi, '(')
    .replace(/%29/gi, ')')
    .replace(/%2A/gi, '*')
    .replace(/%2B/gi, '+')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%3D/gi, '=');
}

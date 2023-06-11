import type { CognitoUser } from 'amazon-cognito-identity-js'

import apiConfig from '@/configs/api-config'
import { ACTIVITY_STREAMS_MIME_TYPE } from './activity-streams'
import type { MumblePost } from '@/types/mumble-post'
import type { Post } from '@/types/post'
import { isPost } from '@/types/post'
import type { UserConfig } from '@/types/user-config'
import { isUserConfig } from '@/types/user-config'

/**
 * Mumble API configuration.
 *
 * @beta
 */
export interface MumbleApiConfig {
  /** Base URL. */
  readonly baseUrl: string
}

/**
 * Mumble API.
 *
 * @beta
 */
export interface MumbleApi {
  /** Returns the configuration for a given user. */
  getUserConfig(user: CognitoUser): Promise<UserConfig>

  /** Submits a given post from a specified user. */
  submitPost(user: CognitoUser, post: MumblePost): Promise<void>

  /** Returns the outbox collection. */
  getOutbox(user: CognitoUser): Promise<OrderedCollection>
}

/**
 * Ordered collection.
 *
 * @beta
 */
export interface OrderedCollection {
  /** URL of the first page. */
  readonly first: string

  /** Returns the first page. */
  getFirstPage(): Promise<OrderedCollectionPage>
}

/**
 * Page in an ordered collection.
 *
 * @beta
 */
export interface OrderedCollectionPage {
  /** Items in the page. */
  readonly orderedItems: unknown[]

  /**
   * Extracts items.
   *
   * @remarks
   *
   * Works as a combination of filter and map operations.
   *
   * @returns
   *
   *   Items that `extractor` returns non-null.
   */
  extractItems<T>(extractor: ItemExtractor<T>): Promise<T[]>
}

/**
 * Extracts value from an item in a {@link OrderedCollection}.
 *
 * @returns
 *
 *   Value extracted from `item`.
 *   `null` if `item` does not contain an expected value.
 *
 * @beta
 */
export type ItemExtractor<T> = (item: unknown) => Promise<T | null>

/**
 * Implementation of {@link MumbleApi}.
 *
 * @beta
 */
export class MumbleApiImpl implements MumbleApi {
  constructor(readonly config: MumbleApiConfig) {}

  async getUserConfig(user: CognitoUser): Promise<UserConfig> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MumbleApiImpl]', 'fetching user config:', user)
    }
    const session = user.getSignInUserSession()
    if (session == null) {
      throw new Error('no active session')
    }
    const idToken = session.getIdToken().getJwtToken()
    const url = `${this.config.baseUrl}/users/${user.getUsername()}/config`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: idToken,
      },
    })
    const data = await res.json()
    if (!isUserConfig(data)) {
      throw new Error(`invalid user config: ${data}`)
    }
    return data
  }

  async submitPost(user: CognitoUser, post: MumblePost): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MumbleApiImpl]', 'submitting post:', user, post)
    }
    const session = user.getSignInUserSession()
    if (session == null) {
      throw new Error('no active session')
    }
    const idToken = session.getIdToken().getJwtToken()
    const url = `${this.config.baseUrl}/users/${user.getUsername()}/outbox`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: idToken,
        'Content-Type': ACTIVITY_STREAMS_MIME_TYPE,
      },
      body: JSON.stringify(post),
    })
  }

  async getOutbox(user: CognitoUser): Promise<OrderedCollection> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MumbleApiImpl]', 'fetching outbox collection:', user)
    }
    const url = `${this.config.baseUrl}/users/${user.getUsername()}/outbox`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/activity+json',
      },
    })
    const data = await res.json()
    return new OrderedCollectionImpl(data)
  }
}

/**
 * Implementation of {@link OrderedCollection}.
 *
 * @beta
 */
export class OrderedCollectionImpl implements OrderedCollection {
  readonly first: string

  constructor(data: unknown) {
    if (typeof data !== 'object' || data == null) {
      throw new RangeError('OrderedCollection data must be a non-null object')
    }
    if (!('first' in data) || typeof data.first !== 'string') {
      throw new RangeError('OrderedCollection data must have a string "first"')
    }
    this.first = data.first
  }

  async getFirstPage(): Promise<OrderedCollectionPage> {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[OrderedCollectionImpl]',
        'fetching first outbox page:',
        this.first,
      )
    }
    const res = await fetch(this.first, {
      method: 'GET',
      headers: {
        Accept: ACTIVITY_STREAMS_MIME_TYPE,
      },
    })
    const data = await res.json()
    return new OrderedCollectionPageImpl(data)
  }
}

/**
 * Implementation of {@link OrderedCollectionPage}.
 *
 * @beta
 */
export class OrderedCollectionPageImpl implements OrderedCollectionPage {
  readonly orderedItems: unknown[]

  constructor(data: unknown) {
    if (typeof data !== 'object' || data == null) {
      throw new RangeError(
        'OrderedCollectionPage data must be a non-null object',
      )
    }
    if (!('orderedItems' in data) || !Array.isArray(data.orderedItems)) {
      throw new RangeError(
        'OrderedCollectionPage data must have an array "orderedItems"',
      )
    }
    this.orderedItems = data.orderedItems
  }

  async extractItems<T>(extractor: ItemExtractor<T>): Promise<T[]> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[OrderedCollectionPageImpl]', 'extracting items from page')
    }
    const items: (T | null)[] = await Promise.all(
      this.orderedItems.map(extractor),
    )
    return items.filter(item => item != null) as T[]
  }
}

/**
 * {@link ItemExtractor} that extracts a post from an item in
 * a {@link OrderedCollectionPage}.
 *
 * @beta
 */
export function extractPost(item: unknown): Promise<Post | null> {
  if (typeof item !== 'object' || item == null) {
    return Promise.resolve(null)
  }
  if (
    !('object' in item) ||
    typeof item.object !== 'object' ||
    item.object == null
  ) {
    return Promise.resolve(null)
  }
  const maybePost = item.object
  if (!isPost(maybePost)) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[extractPost]', 'non-post object:', maybePost)
    }
    return Promise.resolve(null)
  }
  return Promise.resolve(maybePost)
}

/**
 * Default instance of {@link MumbleApi}.
 *
 * @beta
 */
export const mumbleApi = new MumbleApiImpl(apiConfig)

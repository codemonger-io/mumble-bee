import type { CognitoUser } from 'amazon-cognito-identity-js'

import apiConfig from '@/configs/api-config'
import { ACTIVITY_STREAMS_MIME_TYPE } from './activity-streams'
import type { MumblePost } from '@/types/mumble-post'
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
}

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
}

/**
 * Default instance of {@link MumbleApi}.
 *
 * @beta
 */
export const mumbleApi = new MumbleApiImpl(apiConfig)

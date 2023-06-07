import type { CognitoUser } from 'amazon-cognito-identity-js'

import apiConfig from '@/configs/api-config'
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
}

/**
 * Default instance of {@link MumbleApi}.
 *
 * @beta
 */
export const mumbleApi = new MumbleApiImpl(apiConfig)

import type { CognitoUser } from 'amazon-cognito-identity-js'
import { defineStore } from 'pinia'
import { inject, ref, shallowRef, watch } from 'vue'

import type { MumbleApi } from '@/lib/mumble-api'
import type { UserConfig } from '@/types/user-config'

/**
 * Store for the current user.
 *
 * @remarks
 *
 * Stores also the configuration for the user.
 *
 * You have to `provide` a {@link MumbleApi} via "mumbleApi" before using this
 * store.
 *
 * @beta
 */
export const useCurrentUser = defineStore('current-user', () => {
  const mumbleApi: MumbleApi = inject('mumbleApi')!

  const user = shallowRef<CognitoUser | null>(null)

  const refreshSession = async () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[useCurrentUser]', 'refreshing session')
    }
    const currentUser = user.value
    if (currentUser != null) {
      user.value = await new Promise(resolve => {
        currentUser.getSession((err: any) => {
          if (err != null) {
            console.error('[useCurrentUser]', 'failed to refresh session', err)
            resolve(null)
          }
          resolve(currentUser)
        })
      })
    }
    return user.value
  }

  const userConfig = ref<UserConfig | null>(null)
  watch(user, async user => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[useCurrentUser]', 'updating user', user)
    }
    if (user != null) {
      try {
        userConfig.value = await mumbleApi.getUserConfig(user)
      } catch (err) {
        console.error('[useCurrentUser]', 'failed to get user config', err)
      }
    } else {
      userConfig.value = null
    }
  })

  return { user, userConfig, refreshSession }
})

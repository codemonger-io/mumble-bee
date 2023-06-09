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
  const mumbleApi: MumbleApi = inject('mumbleApi')

  const user = shallowRef<CognitoUser | undefined>()

  const userConfig = ref<UserConfig | undefined>()
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
      userConfig.value = undefined
    }
  })

  return { user, userConfig }
})

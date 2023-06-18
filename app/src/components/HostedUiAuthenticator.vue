<script setup lang="ts">
import { useAuthenticator } from '@aws-amplify/ui-vue'
import { Auth } from 'aws-amplify'
import { computed, ref, watchEffect } from 'vue'

import { useCurrentUser } from '@/stores/current-user'

const authenticator = useAuthenticator()

// the app or a parent component must `provide` "mumbleApi"
const currentUser = useCurrentUser()
watchEffect(() => currentUser.user = authenticator.user)

const signIn = () => {
  Auth.federatedSignIn()
}
</script>

<template>
  <div v-if="authenticator.authStatus === 'authenticated'">
    <slot></slot>
  </div>
  <div v-else-if="authenticator.authStatus === 'configuring'">
    <p>Checking the session...</p>
  </div>
  <div v-else class="sign-in-container">
    <a class="button is-primary" @click="signIn()">Sign In</a>
  </div>
</template>

<style scoped>
.sign-in-container {
  display: flex;
  justify-content: center;
  place-items: center;
  width: 100%;
}
</style>

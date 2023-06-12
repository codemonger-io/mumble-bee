<script setup lang="ts">
import { RouterView } from 'vue-router'
import HostedUiAuthenticator from '@/components/HostedUiAuthenticator.vue'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.png" width="125" height="125" />
    <h1 class="title is-1 mumble-title">MumbleBee</h1>
  </header>

  <HostedUiAuthenticator>
    <RouterView />
  </HostedUiAuthenticator>
</template>

<style scoped>
.title {
  &.mumble-title {
    color: var(--color-mumble-logo);
    white-space: nowrap;
  }
}

header {
  display: flex;
  place-items: center;
  justify-content: center;
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 2rem 0 0;
}

@media (min-width: 1024px) {
  header {
    padding-right: calc(var(--section-gap) / 2);
    height: 100vh;
  }
}
</style>

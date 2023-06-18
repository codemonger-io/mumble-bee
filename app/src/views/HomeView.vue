<script setup lang="ts">
import PostList from '@/components/PostList.vue'
import { useCurrentUser } from '@/stores/current-user'

const currentUser = useCurrentUser()
</script>

<template>
  <main>
    <p class="greeting">Hello, {{ currentUser.user?.getUsername() }}</p>
    <PostList />
  </main>
</template>

<style scoped>
.greeting {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>

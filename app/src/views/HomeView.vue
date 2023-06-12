<script setup lang="ts">
import PostList from '@/components/PostList.vue'
import { useCurrentUser } from '@/stores/current-user'

const currentUser = useCurrentUser()
</script>

<template>
  <main>
    <p>Hello, {{ currentUser.user?.getUsername() }}</p>
    <PostList />
  </main>
</template>

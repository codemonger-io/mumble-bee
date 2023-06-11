<script setup lang="ts">
import { inject, ref, watch } from 'vue'

import type { MumbleApi, OrderedCollectionPage } from '@/lib/mumble-api'
import { extractPost } from '@/lib/mumble-api'
import { useCurrentUser } from '@/stores/current-user'
import type { Post } from '@/types/post'

import PostComponent from './Post.vue'

const mumbleApi: MumbleApi = inject('mumbleApi')!

const currentUser = useCurrentUser()

const posts = ref<Post[]>([])

watch(
  () => currentUser.user,
  async user => {
    if (user == null) {
      return
    }
    const postCollection = await mumbleApi.getOutbox(user)
    const firstPage = await postCollection.getFirstPage()
    posts.value = await firstPage.extractItems(extractPost)
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <h3 class="title is-5">Recent posts</h3>
  <PostComponent v-for="post in posts" :key="post.id" :post="post" />
</template>

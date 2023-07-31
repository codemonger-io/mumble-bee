<script setup lang="ts">
import DOMPurify from 'dompurify'
import { computed } from 'vue'

import type { Post } from '@/types/post'

const props = defineProps<{
  post: Post,
}>()

const safeContent = computed(() => {
  return DOMPurify.sanitize(props.post.content)
})
</script>

<template>
  <div class="card block">
    <div class="card-content">
      <div class="content">
        <div class="post-content markdown-content" v-html="safeContent"></div>
        <p class="post-date">{{ post.published }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-date {
  font-size: 0.8em;
}
</style>

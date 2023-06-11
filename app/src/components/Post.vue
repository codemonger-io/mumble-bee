<script setup lang="ts">
import type { Post } from '@/types/post'

defineProps<{
  post: Post,
}>()
</script>

<template>
  <div class="card block">
    <div class="card-content">
      <div class="content">
        <p class="post-content">{{ post.content }}</p>
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

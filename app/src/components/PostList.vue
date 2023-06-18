<script setup lang="ts">
import PostEditor from './PostEditor.vue'
import RecentPosts from './RecentPosts.vue'
</script>

<template>
  <div class="post-list">
    <div class="post-editor block">
      <PostEditor />
    </div>
    <div class="recent-posts block">
      <RecentPosts />
    </div>
  </div>
</template>

<style scoped>
.post-list {
  display: flex;
  flex-direction: column;
  place-items: center;
  justify-content: flex-start;
  max-width: 30rem;
  margin-top: 1rem;

  .post-editor,
  .recent-posts {
    width: 100%;
  }
}
</style>

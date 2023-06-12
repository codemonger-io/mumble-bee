<script setup lang="ts">
import { ref, watch } from 'vue'

import type { Attachment, AttachmentState } from '@/types/attachment'

const props = defineProps<{
  attachments: Attachment[],
  isSubmittable: boolean,
}>()
const emit = defineEmits<{
  (e: 'attachment-added', file: File): void
  (e: 'attachment-deleted', attachment: Attachment): void
}>()

const file = ref<File | undefined>()
watch(file, _file => {
  if (_file != null) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PostEditorControls]', 'selected attachment', _file.name)
    }
    emit('attachment-added', _file)
    // waits for another file
    file.value = undefined
  } else {
    // workaround: forces to clear the file input
    fileChooser.value?.clearInput()
  }
})
const fileChooser = ref()

const getAttachmentIcon = (state: AttachmentState) => {
  switch (state) {
    case 'uploading':
      return 'upload'
    case 'uploaded':
      return 'check'
    case 'deleting':
      return 'delete'
    default:
      const exhaustiveCheck: never = state
      throw new RangeError('unknown attachment state: ' + state)
  }
}
const getAttachmentType = (state: AttachmentState) => {
  switch (state) {
    case 'uploading':
      return 'is-warning'
    case 'uploaded':
      return 'is-info'
    case 'deleting':
      return 'is-danger'
    default:
      const exhaustiveCheck: never = state
      throw new RangeError('unknown attachment state: ' + state)
  }
}
</script>

<template>
  <div class="field">
    <div class="level">
      <div class="level-left">
        <b-field class="file is-info">
          <b-upload ref="fileChooser" v-model="file" class="file-label">
            <span class="file-cta">
              <b-icon class="file-icon is-icon-only" icon="paperclip"></b-icon>
            </span>
          </b-upload>
        </b-field>
      </div>
      <div class="level-right">
        <input
          type="submit"
          class="button is-primary"
          value="Mumble"
          :disabled="!isSubmittable"
        >
      </div>
    </div>
  </div>
  <div class="attachments">
    <h3>{{ attachments.length > 0 ? 'Attachments' : 'No attachments' }}</h3>
    <b-taglist v-if="attachments.length > 0">
      <b-tag
        v-for="attachment in attachments"
        :key="attachment.id"
        :icon="getAttachmentIcon(attachment.state)"
        :type="getAttachmentType(attachment.state)"
        closable
        @close="emit('attachment-deleted', attachment)"
      >
        {{ attachment.filename }}
      </b-tag>
    </b-taglist>
  </div>
</template>

<style scoped>
.file-cta {
  .file-icon {
    &.is-icon-only {
      margin-right: 0;
    }
  }
}
</style>

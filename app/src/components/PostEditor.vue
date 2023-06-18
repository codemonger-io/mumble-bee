<script setup lang="ts">
import { computed, inject, reactive, ref, watch } from 'vue'

import { Auth } from 'aws-amplify'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { Credentials, Provider } from '@aws-sdk/types'

import apiConfig from '@/configs/api-config'
import authConfig from '@/configs/auth-config'
import { ACTIVITY_STREAMS_PUBLIC_ADDRESS } from '@/lib/activity-streams'
import { createCredentialsProvider } from '@/lib/credentials-provider'
import type { MumbleApi } from '@/lib/mumble-api'
import { useCurrentUser } from '@/stores/current-user'
import type { Attachment } from '@/types/attachment'
import { createAttachment } from '@/types/attachment'
import type { NewPost } from '@/types/post'

import PostEditorControls from './PostEditorControls.vue'

const mumbleApi: MumbleApi = inject('mumbleApi')!

const currentUser = useCurrentUser()
const credentialsProvider = computed<Provider<Credentials> | undefined>(() => {
  const user = currentUser.user
  if (user != null) {
    return createCredentialsProvider(user)
  } else {
    return undefined
  }
})

const content = ref<string>('')
const trimmedContent = computed(() => content.value.trim())
const attachments = reactive([] as Attachment[])
const allAttachmentsUploaded = computed(() => {
  return attachments.every(a => a.state === 'uploaded')
})
const isSubmitting = ref<boolean>(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    const _content = trimmedContent.value
    if (_content.length === 0 || !allAttachmentsUploaded.value) {
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[PostEditor]',
        'submitting',
        _content,
        attachments,
      )
    }
    const user = currentUser.user
    if (user == null) {
      return
    }
    const post: NewPost = {
      type: 'Note',
      content: _content,
      to: [ACTIVITY_STREAMS_PUBLIC_ADDRESS],
      cc: [`${apiConfig.baseUrl}/users/${user.getUsername()}/followers`],
    }
    if (attachments.length > 0) {
      post['attachment'] = attachments.map(a => ({
        type: 'Image',
        mediaType: a.mimeType,
        url: a.url!,
      }))
    }
    await mumbleApi.submitPost(user, post)
    content.value = ''
    attachments.splice(0, attachments.length)
  } finally {
    isSubmitting.value = false
  }
}
const isSubmittable = computed(() => {
  return trimmedContent.value.length > 0
    && allAttachmentsUploaded.value
    && !isSubmitting.value
})

const uploadAttachment = async (
  file: File,
  bucketName: string,
  credentials: Provider<Credentials>,
) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[PostEditor]', 'uploading attachment', file)
  }
  attachments.push(createAttachment(file))
  const id = attachments[attachments.length - 1].id
  const username = currentUser.user!.getUsername()
  const client = new S3Client({
    region: authConfig.region,
    credentials,
  })
  try {
    const objectKey = `media/users/${username}/${id}`
    const res = await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: file,
        ContentType: file.type,
      }),
    )
    const uploaded = attachments.find(a => a.id === id)
    uploaded!.state = 'uploaded'
    uploaded!.url = `${apiConfig.baseUrl}/${objectKey}`
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[PostEditor]',
        'finished uploading attachment',
        uploaded,
        res,
      )
    }
  } catch (err) {
    if (
      typeof err === 'object' &&
      err != null &&
      err.toString().startsWith('NotAuthorizedException:')
    ) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[PostEditor]', 'refreshing credentials')
      }
      Auth.currentAuthenticatedUser()
        .catch(err => {
          console.error('[PostEditor]', 'failed to refresh credentials', err)
        })
    } else {
      console.error('[PostEditor]', 'failed to upload attachment', err)
    }
    const index = attachments.findIndex(a => a.id === id)
    if (index !== -1) {
      attachments.splice(index, 1)
    }
  }
}

const deleteAttachment = async (
  id: string,
  bucketName: string,
  credentials: Provider<Credentials>,
) => {
  const attachment = attachments.find(a => a.id === id)
  if (attachment == null) {
    return
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('[PostEditor]', 'deleting attachment', attachment)
  }
  const username = currentUser.user!.getUsername()
  attachment.state = 'deleting'
  const client = new S3Client({
    region: authConfig.region,
    credentials,
  })
  const objectKey = `media/users/${username}/${id}`
  const res = await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    }),
  )
  if (process.env.NODE_ENV !== 'production') {
    console.log('[PostEditor]', 'finished deleting attachment', attachment, res)
  }
  const index = attachments.indexOf(attachment)
  if (index !== -1) {
    attachments.splice(index, 1)
  }
}

const attachmentQueue = reactive<File[]>([])
watch(
  [
    attachmentQueue,
    () => currentUser.userConfig?.objectsBucketName,
    credentialsProvider,
  ],
  ([queue, bucketName, credentials]) => {
    if (queue.length > 0 && bucketName != null && credentials != null) {
      const file = queue.pop()!
      uploadAttachment(file, bucketName, credentials)
    }
  },
)

const onAttachmentAdded = (file: File) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[PostEditor]', 'attachment added', file)
  }
  attachmentQueue.push(file)
}

const onAttachmentDeleted = (attachment: Attachment) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[PostEditor]', 'attachment deleted', attachment)
  }
  const bucketName = currentUser.userConfig?.objectsBucketName
  const credentials = credentialsProvider.value
  if (bucketName == null || credentials == null) {
    return
  }
  deleteAttachment(attachment.id, bucketName, credentials)
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <b-field label="What are you going to mumble?">
      <b-input
        type="textarea"
        v-model="content"
        placeholder="What are you going to mumble?"
        @keyup.enter.shift.prevent="onSubmit"
      >
      </b-input>
    </b-field>
    <PostEditorControls
      :attachments="attachments"
      :is-submittable="isSubmittable"
      @attachment-added="onAttachmentAdded"
      @attachment-deleted="onAttachmentDeleted"
    />
  </form>
</template>

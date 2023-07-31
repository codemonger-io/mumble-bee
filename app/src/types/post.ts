/**
 * Single post.
 *
 * @beta
 */
export interface Post {
  /** Activity streams object type is always "Note". */
  readonly type: 'Note'

  /** ID of the post. */
  readonly id: string

  /** Published date; e.g., "2023-06-11T01:00:23Z". */
  readonly published: string

  /** Content of the post. */
  content: string

  /** Source of the post. */
  source?: PostSource

  /** "to". */
  to: string[]

  /** "cc". */
  cc: string[]

  /** Optional attachments. */
  attachment?: AttachmentLink[]
}

/**
 * Source of a post.
 *
 * @beta
 */
export interface PostSource {
  /** Content of the source. */
  content: string

  /** MIME-type of the source content. */
  mediaType: string
}

/**
 * Link to an attachment.
 *
 * @beta
 */
export interface AttachmentLink {
  /** Activity Streams object type of the attachment. */
  readonly type: string

  /** Media type of the attachment. */
  mediaType: string

  /** URL of the attachment. */
  url: string
}

/**
 * New post.
 *
 * @beta
 */
export type NewPost = Omit<Post, 'id' | 'published'>

/**
 * Returns if a given value is a {@link Post}.
 *
 * @remarks
 *
 * Narrows `value` to {@link Post}.
 *
 * @beta
 */
export function isPost(value: unknown): value is Post {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if ((value as Post).type !== 'Note') {
    return false
  }
  if (typeof (value as Post).id !== 'string') {
    return false
  }
  if (typeof (value as Post).published !== 'string') {
    return false
  }
  if (typeof (value as Post).content !== 'string') {
    return false
  }
  if (!Array.isArray((value as Post).to)) {
    return false
  }
  if (!(value as Post).to.every(to => typeof to === 'string')) {
    return false
  }
  if (!Array.isArray((value as Post).cc)) {
    return false
  }
  if (!(value as Post).cc.every(cc => typeof cc === 'string')) {
    return false
  }
  if ((value as Post).attachment != null) {
    if (!Array.isArray((value as Post).attachment)) {
      return false
    }
    if (!(value as Post).attachment!.every(isAttachmentLink)) {
      return false
    }
  }
  return true
}

/**
 * Returns if a given value is an `{@link AttachmentLink}`.
 *
 * @remarks
 *
 * Narrows `value` to {@link AttachmentLink}.
 *
 * @beta
 */
export function isAttachmentLink(value: unknown): value is AttachmentLink {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (typeof (value as AttachmentLink).type !== 'string') {
    return false
  }
  if (typeof (value as AttachmentLink).mediaType !== 'string') {
    return false
  }
  if (typeof (value as AttachmentLink).url !== 'string') {
    return false
  }
  return true
}

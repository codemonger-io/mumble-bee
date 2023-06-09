/**
 * Mumble post.
 *
 * @beta
 */
export interface MumblePost {
  /** Activity Streams object type is always "Note". */
  readonly type: 'Note'

  /** Content of the post. */
  content: string

  /** "to". */
  to: string[]

  /** "cc". */
  cc: string[]

  /** Optional attachments. */
  attachment?: AttachmentLink[]
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

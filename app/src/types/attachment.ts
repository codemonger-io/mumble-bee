/**
 * Attachment with the state.
 *
 * @beta
 */
export interface Attachment {
  /** ID of the attachment. */
  readonly id: string

  /** Name of the file. */
  readonly filename: string

  /** MIME type of the file. */
  readonly mimeType: string

  /** State of the attachment. */
  state: AttachmentState

  /**
   * URL of the attachment.
   *
   * @remarks
   *
   * This has to be set after the attachment has been uploaded.
   */
  url?: string
}

/**
 * State of an attachment.
 *
 * @beta
 */
export type AttachmentState = 'uploading' | 'uploaded' | 'deleting'

/**
 * Creates an {@link Attachment} from a given `File`.
 *
 * @remarks
 *
 * The ID of the attachment consists of two parts:
 * - a unique part generated randomly (UUID v4)
 * - the extension of the file (empty if the file has no extension)
 *
 * @beta
 */
export function createAttachment(file: File): Attachment {
  const uniquePart = crypto.randomUUID().toString('hex')
  const extIndex = file.name.lastIndexOf('.')
  const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
  const id = uniquePart + ext
  if (process.env.NODE_ENV !== 'production') {
    console.log('[createAttachment]', 'generated ID', id)
  }
  return {
    id,
    filename: file.name,
    mimeType: file.type,
    state: 'uploading',
  }
}

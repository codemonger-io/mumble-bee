/**
 * Configuration for a user.
 *
 * @beta
 */
export interface UserConfig {
  /** Name of the S3 bucket for media objects. */
  objectsBucketName: string
}

/**
 * Returns if a given value is a {@link UserConfig}.
 *
 * @remarks
 *
 * This function narrows `value` to {@link UserConfig}.
 *
 * @beta
 */
export function isUserConfig(value: unknown): value is UserConfig {
  if (typeof value !== 'object' || value == null) {
    return false
  }
  if (typeof value.objectsBucketName !== 'string') {
    return false
  }
  return true
}

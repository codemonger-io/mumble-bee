import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import type { Credentials, Provider } from '@aws-sdk/types'
import type { CognitoUser } from 'amazon-cognito-identity-js'

import authConfig from '@/configs/auth-config'

/**
 * Creates a provider of credentials associated with a given user.
 *
 * @remarks
 *
 * You can specify a returned value to `credentials` property of an AWS
 * service client.
 *
 * @beta
 */
export function createCredentialsProvider(
  user: CognitoUser,
): Provider<Credentials> {
  const session = user.getSignInUserSession()
  const jwtToken = session.getIdToken().getJwtToken()
  const { identityPoolId, region, userPoolId } = authConfig
  const providerName = `cognito-idp.${region}.amazonaws.com/${userPoolId}`
  return fromCognitoIdentityPool({
    identityPoolId,
    logins: {
      [providerName]: jwtToken,
    },
    clientConfig: {
      region,
    },
  })
}

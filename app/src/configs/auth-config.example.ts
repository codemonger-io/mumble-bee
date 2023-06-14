// Please consider using the `configure` npm script.
const region = '<REGION>'

const domainPrefix = '<HOSTED_UI_DOMAIN_PREFIX>'

const authConfig = {
  region,
  userPoolId: '<USER_POOL_ID>',
  userPoolWebClientId: '<USER_POOL_CLIENT_ID>',
  identityPoolId: '<IDENTITY_POOL_ID>',
  oauth: {
    domain: `${domainPrefix}.auth.${region}.amazoncognito.com`,
    scope: ['email', 'openid'],
    redirectSignIn: 'http://localhost:<PORT>/',
    redirectSignOut: 'http://localhost:<PORT>/',
    responseType: 'code',
  },
}

export default authConfig

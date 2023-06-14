/**
 * Configures the project for a given deployment stage.
 *
 * @remarks
 *
 * Run this script to configure the following config files:
 * - `src/configs/api-config.ts`
 * - `src/configs/auth-config.ts`
 *
 * This script requires AWS credential that has sufficient privileges to
 * describe the CloudFormation stack and to read the Parameter Store.
 * My recommendation is specifying the AWS profile used to deploy the Mumble
 * API stack to the `AWS_PROFILE` environment variable.
 *
 * This script needs the AWS region where the user pool resides and tries to
 * obtain the one associated with the AWS profile, though, you can override it
 * by specifying the `AWS_REGION` environment variable.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import {
  getProfileName,
  parseKnownFiles,
} from '@aws-sdk/shared-ini-file-loader'

const promiseWriteFile = util.promisify(fs.writeFile)

const DEPLOYMENT_STAGES = ['development', 'production'] as const
type DeploymentStage = typeof DEPLOYMENT_STAGES[number]

const STACK_NAME_PREFIX = 'mumble-'

yargs(hideBin(process.argv))
  .command(
    '$0 <stage>',
    'configures the project for a given deployment stage',
    _yargs => {
      return _yargs
        .positional('stage', {
          describe: 'deployment stage',
          choices: DEPLOYMENT_STAGES,
          default: 'development' as DeploymentStage,
        })
    },
    async ({ stage }) => {
      console.log('configuring project for stage:', stage)
      console.log('obtaining AWS region')
      const region = await getRegion()
      console.log('AWS region:', region)
      console.log('loading stack outputs for stage:', stage)
      const stackOutputs = await getStackOutputs(stage)
      console.log('stack outputs:', stackOutputs)
      console.log(
        'loading domain name from Parameter Store:',
        stackOutputs.domainNameParameterPath,
      )
      const domainName = await getDomainName(
        stackOutputs.domainNameParameterPath,
      )
      console.log('domain name:', domainName)
      console.log('generating api-config.ts')
      await generateApiConfig({ domainName })
      console.log('generating auth-config.ts')
      await generateAuthConfig({
        ...stackOutputs,
        region,
      })
    },
  )
  .help()
  .argv

/**
 * Obtains the current AWS region.
 *
 * @remarks
 *
 * Precedence:
 * 1. `AWS_REGION` environment variable
 * 2. region associated with the profile specified to `AWS_PROFILE`
 *    environment variable
 * 3. region associated with the default profile
 */
async function getRegion(): Promise<string> {
  if (process.env.AWS_REGION != null) {
    return process.env.AWS_REGION
  }
  const profiles = await parseKnownFiles({})
  const profileName = getProfileName({})
  console.log('profile name:', profileName)
  const profile = profiles[profileName]
  if (profile == null) {
    throw new Error(`profile not found: ${profileName}`)
  }
  const region = profile.region
  if (region == null) {
    throw new Error(`no region is associated with profile: ${profileName}`)
  }
  return region
}

interface StackOutputs {
  /**
   * Path to the parameter that stores the domain name of the Mumble API in
   * Parameter Store on AWS Systems Manager.
   */
  readonly domainNameParameterPath: string

  /** User pool ID. */
  readonly userPoolId: string

  /** User pool client ID with the hosted UI. */
  readonly userPoolHostedUiClientId: string

  /** Domain name of the user pool. */
  readonly userPoolDomainName: string

  /** Identity pool ID. */
  readonly identityPoolId: string
}

/**
 * Obtains the outputs from the CloudFormation stack.
 *
 * @throws Error
 *
 *   If the stack does not exist,
 *   or if the stack has no outputs,
 *   or if the stack output lacks any necessary key.
 */
async function getStackOutputs(stage: DeploymentStage): Promise<StackOutputs> {
  const client = new CloudFormationClient({})
  const stackName = STACK_NAME_PREFIX + stage
  console.log('describing stack:', stackName)
  const res = await client.send(new DescribeStacksCommand({
    StackName: stackName,
  }))
  if (res.Stacks == null) {
    throw new Error(`stack not found: ${stackName}`)
  }
  const stack = res.Stacks[0]
  if (stack == null) {
    throw new Error(`stack not found: ${stackName}`)
  }
  if (stack.Outputs == null) {
    throw new Error(`stack has no outputs: ${stackName}`)
  }
  const outputMap: Map<string, string> = new Map()
  for (const output of stack.Outputs) {
    if (output.OutputKey != null && output.OutputValue != null) {
      outputMap.set(output.OutputKey, output.OutputValue)
    }
  }
  const domainNameParameterPath = outputMap.get('DomainNameParameterPath')
  if (domainNameParameterPath == null) {
    throw new Error('stack output not found: DomainNameParameterPath')
  }
  const userPoolId = outputMap.get('UserPoolId')
  if (userPoolId == null) {
    throw new Error('stack output not found: UserPoolId')
  }
  const userPoolHostedUiClientId = outputMap.get('UserPoolHostedUiClientId')
  if (userPoolHostedUiClientId == null) {
    throw new Error('stack output not found: UserPoolHostedUiClientId')
  }
  const userPoolDomainName = outputMap.get('UserPoolDomainName')
  if (userPoolDomainName == null) {
    throw new Error('stack output not found: UserPoolDomainName')
  }
  const identityPoolId = outputMap.get('IdentityPoolId')
  if (identityPoolId == null) {
    throw new Error('stack output not found: IdentityPoolId')
  }
  return {
    domainNameParameterPath,
    userPoolId,
    userPoolHostedUiClientId,
    userPoolDomainName,
    identityPoolId,
  }
}

/**
 * Obtains the domain name from Parameter Store on AWS Systems Manager.
 *
 * @throws Error
 *
 *   If the parameter is not configured.
 */
async function getDomainName(parameterPath: string): Promise<string> {
  const client = new SSMClient({})
  const res = await client.send(new GetParameterCommand({
    Name: parameterPath,
    WithDecryption: true,
  }))
  const domainName = res.Parameter?.Value
  if (domainName == null) {
    throw new Error(
      'you have to configure the Mumble API domain name in Parameter Store: ' +
      parameterPath,
    )
  }
  return domainName
}

/** Parameters for `api-config.ts`. */
interface ApiConfigParams {
  /** Domain name. */
  readonly domainName: string
}

/** Generates `api-config.ts`. */
async function generateApiConfig(params: ApiConfigParams): Promise<void> {
  const apiConfig = `// Generated: API configuration
export default {
  baseUrl: 'https://${params.domainName}',
}`
  const apiConfigPath = path.resolve(
    __dirname,
    '../src/configs/api-config.ts',
  )
  console.log('writing api-config.ts:', apiConfigPath)
  console.log(apiConfig)
  await promiseWriteFile(apiConfigPath, apiConfig)
}

/** Parameters for `auth-config.ts`. */
interface AuthConfigParams extends Pick<
  StackOutputs,
  'userPoolId'
  | 'userPoolHostedUiClientId'
  | 'identityPoolId'
  | 'userPoolDomainName'
> {
  /** AWS region of the user pool. */
  readonly region: string
}

/** Generates `auth-config.ts`. */
async function generateAuthConfig(params: AuthConfigParams): Promise<void> {
  const authConfig = `// Generated: Auth configuration
const callbackUrl = window.location.protocol + '//' + window.location.host + '/'
const authConfig = {
  region: '${params.region}',
  userPoolId: '${params.userPoolId}',
  userPoolWebClientId: '${params.userPoolHostedUiClientId}',
  identityPoolId: '${params.identityPoolId}',
  oauth: {
    domain: '${params.userPoolDomainName}',
    scope: ['email', 'openid'],
    redirectSignIn: callbackUrl,
    redirectSignOut: callbackUrl,
    responseType: 'code',
  },
}
export default authConfig`
  const authConfigPath = path.resolve(
    __dirname,
    '../src/configs/auth-config.ts',
  )
  console.log('writing auth-config.ts:', authConfigPath)
  console.log(authConfig)
  await promiseWriteFile(authConfigPath, authConfig)
}

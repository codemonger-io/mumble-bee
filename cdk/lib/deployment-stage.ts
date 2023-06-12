import { Node } from 'constructs';

/**
 * Possible deployment stages.
 *
 * @beta
 */
export const DEPLOYMENT_STAGES = ['development', 'production'] as const;

/**
 * Type representing a deployment stage.
 *
 * @beta
 */
export type DeploymentStage = typeof DEPLOYMENT_STAGES[number];

/**
 * CDK context variable name for the deployment stage.
 *
 * @beta
 */
export const DEPLOYMENT_STAGE_CONTEXT = 'mumble-bee:stage';

/**
 * Returns if a given value is a {@link DeploymentStage}.
 *
 * @remarks
 *
 * Narrows `value` to {@link DeploymentStage}.
 *
 * @beta
 */
export function isDeploymentStage(value: unknown): value is DeploymentStage {
  return DEPLOYMENT_STAGES.includes(value as any);
}

/**
 * Obtains the deployment stage from a given node.
 *
 * @remarks
 *
 * Reads the context variable "mumble-bee:stage" from `node`.
 *
 * @throws Error
 *
 *   If `node` does not have the deployment stage.
 *
 * @throws RangeError
 *
 *   If `node` has an invalid value for the deployment stage.
 *
 * @beta
 */
export function getDeploymentStage(node: Node): DeploymentStage {
  const stage = node.tryGetContext(DEPLOYMENT_STAGE_CONTEXT);
  if (stage == null) {
    throw new Error(`no deployment stage is configured`);
  }
  if (!isDeploymentStage(stage)) {
    throw new RangeError(`invalid deployment stage: ${stage}`);
  }
  return stage;
}

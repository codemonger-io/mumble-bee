import { isDeploymentStage } from '../lib/deployment-stage';

describe('DeploymentStage', () => {
  it('isDeploymentStage should be true for "development"', () => {
    expect(isDeploymentStage('development')).toBe(true);
  });

  it('isDeploymentStage should be true for "production"', () => {
    expect(isDeploymentStage('production')).toBe(true);
  });

  it('isDeploymentStage should be false for "unknown"', () => {
    expect(isDeploymentStage('unknown')).toBe(false);
  });
});

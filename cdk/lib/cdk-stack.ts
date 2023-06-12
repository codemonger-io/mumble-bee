import type { StackProps } from 'aws-cdk-lib';
import { CfnOutput, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ContentsDistribution } from './contents-distribution';
import type { DeploymentStage } from './deployment-stage';

export interface Props extends StackProps {
  /** Deployment stage. */
  readonly deploymentStage: DeploymentStage;
}

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { deploymentStage } = props;

    const distribution = new ContentsDistribution(
      this,
      'ContentsDistribution',
      {
        deploymentStage,
      },
    );

    // outputs
    new CfnOutput(this, 'ContentsBucketName', {
      description: 'Name of the S3 bucket that contains the contents',
      value: distribution.bucket.bucketName,
    });
    new CfnOutput(this, 'ContentsDistributionDomainName', {
      description:
        'Domain name of the CloudFront distribution for the contents',
      value: distribution.distribution.domainName,
    });
  }
}

import {
  RemovalPolicy,
  aws_certificatemanager as acm,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import domainNameConfig from '../configs/domain-name-conf';

import type { DeploymentStage } from './deployment-stage';

/** Configuration of the domain name and certificate for production. */
interface DomainNameConfig {
  /** Domain name. */
  readonly domainName: string;
  /** ARN of the certificate. */
  readonly certificateArn: string;
}

export interface Props {
  /** Deployment stage. */
  readonly deploymentStage: DeploymentStage;
}

/**
 * CDK construct that provisions the S3 bucket and the CloudFront distribution
 * for the contents.
 *
 * @beta
 */
export class ContentsDistribution extends Construct {
  /** S3 bucket for the contents. */
  readonly bucket: s3.Bucket;
  /** CloudFront distribution for the contents. */
  readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { deploymentStage } = props;

    this.bucket = new s3.Bucket(this, 'ContentsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: deploymentStage === 'production',
      removalPolicy: RemovalPolicy.RETAIN,
    });

    let domainNameAndCertificate;
    if (deploymentStage === 'production') {
      const config: DomainNameConfig = domainNameConfig;
      domainNameAndCertificate = {
        domainNames: [config.domainName],
        certificate: acm.Certificate.fromCertificateArn(
          this,
          'DistributionCertificate',
          config.certificateArn,
        ),
      };
    } else {
      domainNameAndCertificate = {};
    }
    this.distribution = new cloudfront.Distribution(
      this,
      'ContentsDistribution',
      {
        comment: `MumbleBee contents distribution (${deploymentStage})`,
        defaultBehavior: {
          origin: new origins.S3Origin(this.bucket),
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          // single page application that uses normal-looking URLs for web
          // history needs the following fallback
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
        enableLogging: true,
        enabled: true,
        ...domainNameAndCertificate,
      },
    );
  }
}

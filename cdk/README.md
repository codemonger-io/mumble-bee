# MumbleBee CDK Stack

This is an [AWS Cloud Development Kit (CDK)](https://aws.amazon.com/cdk/) stack that provisions necessary resources to deliver MumbleBee via [Amazon S3](https://aws.amazon.com/s3/) + [Amazon CloudFront](https://aws.amazon.com/cloudfront/).

## Prerequisites

You need the following software installed:
- [Node.js](https://nodejs.org/) v16 or later
- [AWS CLI](https://aws.amazon.com/cli/) v2

## Setting AWS_PROFILE

This document supposes that you have [`AWS_PROFILE`](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html#cli-configure-files-using-profiles) environment variable configured with an AWS profile with sufficient privileges.

Here is my example:

```sh
export AWS_PROFILE=codemonger-jp
```

## Setting the toolkit stack name

This document supposes the toolkit stack name is `mumble-bee-toolkit-stack` and stored in `TOOLKIT_STACK_NAME` variable.
You do not have to follow this convention and may use the default, but I like this because I can avoid mixing up other projects in one place.
This is especially useful when you want to clean up a project.

```sh
TOOLKIT_STACK_NAME=mumble-bee-toolkit-stack
```

## Setting the toolkit qualifier

This document supposes the [toolkit qualifier](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html#bootstrapping-custom-synth) is `mmblbe2023` and stored in `BOOTSTRAP_QUALIFIER` variable.
You should avoid using the default qualifier unless you are using the default toolkit stack name.

```sh
BOOTSTRAP_QUALIFIER=mmblbe2023
```

## Preparing configuration file

You have to prepare the following configuration file:
- `configs/domain-name-conf.ts`: domain name and certificate ARN for production

The configuration file is never committed to this repository because it contains information specific to your environment.
You can find an example at [`configs/domain-name-conf.example.ts`](./configs/domain-name-conf.example.ts).
If you do not have a plan to deploy the application for production, you can copy the example as the configuration file.

## Provisioning the certificate for the domain name

How to provision the certificate for the domain name is out of the scope of this document.
Here are some references for you:
- ["Routing traffic to an Amazon CloudFront distribution by using your domain name" - _Amazon Route 53_](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-cloudfront-distribution.html)
- ["Requirements for using SSL/TLS certificates with CloudFront" - _Amazon CloudFront_](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
- ["Requesting a public certificate" - _AWS Certificate Manager_](https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html)
- ["Using custom URLs by adding alternate domain names (CNAMEs)" - _Amazon CloudFront_](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)

One important requirement you may easily overlook is that the [**certificate must be provisioned in the `us-east-1` region**](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html#https-requirements-certificate-issuer).

## Provisioning the toolkit stack

This is necessary only once before provisioning the CDK stack for the first time.

```sh
npx cdk bootstrap --toolkit-stack-name $TOOLKIT_STACK_NAME --qualifier $BOOTSTRAP_QUALIFIER
```

## Synthesizing a CloudFormation template

We can check the CloudFormation template before deploying it.

For development:

```sh
npx cdk synth -c "@aws-cdk/core:bootstrapQualifier=$BOOTSTRAP_QUALIFIER"
```

This CDK stack uses the CDK context variable "mumble-bee:stage" to determine the deployment stage, which is "development" by default.
You have to override it for production:

```sh
npx cdk synth -c "@aws-cdk/core:bootstrapQualifier=$BOOTSTRAP_QUALIFIER" -c "mumble-bee:stage=production"
```

## Deploying the CDK stack

For development:

```sh
npx cdk deploy --toolkit-stack-name $TOOLKIT_STACK_NAME -c "@aws-cdk/core:bootstrapQualifier=$BOOTSTRAP_QUALIFIER"
```

This CDK stack uses the CDK context variable "mumble-bee:stage" to determine the deployment stage, which is "development" by default.
You have to override it for production:

```sh
npx cdk deploy --toolkit-stack-name $TOOLKIT_STACK_NAME -c "@aws-cdk/core:bootstrapQualifier=$BOOTSTRAP_QUALIFIER" -c "mumble-bee:stage=production"
```

The CloudFormation stack will be deployed as:
- `mumble-bee-development` for development
- `mumble-bee-production` for production

## After deployment

The following subsections suppose that the deployment stage is stored in `DEPLOYMENT_STAGE` variable.
Please replace `$DEPLOYMENT_STAGE` with "development" or "production".

### Uploading the application

Please take the following steps to uppload your application to the S3 bucket provisioned by the CDK stack:

1. Suppose you are in this folder

2. Build the application for production

   Please refer to [Section "Building for production" in `/app/README.md`](../app/README.md#building-for-production) for how to do it.

3. Obtain the S3 bucket name

   The CDK stack outputs the name of the S3 bucket as `ContentsBucketName`:

    ```sh
    CONTENTS_BUCKET_NAME=`aws cloudformation describe-stacks --stack-name mumble-bee-$DEPLOYMENT_STAGE --query "Stacks[0].Outputs[?OutputKey=='ContentsBucketName']|[0].OutputValue" --output text`
    ```

4. Copy the contents in app's `dist` folder to the S3 bucket:

    ```sh
    aws s3 cp ../app/dist/ s3://$CONTENTS_BUCKET_NAME/ --recursive
    ```
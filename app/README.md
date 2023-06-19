# MumbleBee Application

MumbleBee is a single page application (SPA) built with [Vue 3](https://v3.vuejs.org/).
This project was initialized with [Vite](https://vitejs.dev/).

## Prerequisites

You need [Node.js](https://nodejs.org/en) v16 or later installed.

## Resolving dependencies

```sh
npm ci
```

## Preparing configuration files for the Mumble server

You have to prepare the following files:
- [`src/configs/api-config.ts`](#srcconfigsapi-configts)
- [`src/configs/auth-config.ts`](#srcconfigsauth-configts)

These files are never committed to this repository because they contain information specific to your environment.

### `src/configs/api-config.ts`

You can find an example at [`src/configs/api-config.example.ts`](./src/configs/api-config.example.ts).

### `src/configs/auth-config.ts`

You can find an example at [`src/configs/auth-config.example.ts`](./src/configs/auth-config.example.ts).

You also have to make sure that the URL of your MumbleBee app is registered as a callback URL for the Mumble authenticator ([AWS Cognito user pool client](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-idp-settings.html)).
Please refer to the [Mumble CDK documentation](https://github.com/codemonger-io/mumble/tree/main/cdk#configuring-cognito-user-pool-client-callback-urls) for how to configure it.

### Generating configuration files

If you have deployed and configured the Mumble server following the instructions in the [Mumble CDK documentation](https://github.com/codemonger-io/mumble/blob/main/cdk/README.md), you can generate the configuration files with the [`configure` npm script](./scripts/configure.ts).

For development:

```sh
npm run configure -- development
```

For production:

```sh
npm run configure -- production
```

## Building for production

You have to make sure the configuration files are properly configured before building for production.
There is a helper npm script `build:release` to make sure the configuration files are auto-generated before building for production.

```sh
npm run build:release
```

## Hosting MumbleBee

You may host your MumbleBee app on whatever platform you like.
But, in the [`/cdk` folder](../cdk), you can find an [AWS Cloud Development Kit (CDK)](https://aws.amazon.com/cdk/) stack that provisions necessary resources to deliver the app via [Amazon S3](https://aws.amazon.com/s3/) + [Amazon CloudFront](https://aws.amazon.com/cloudfront/).

## Vite scripts

The following [Vite](https://vitejs.dev/) scripts are also available.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

Please use [`build:release`](#building-for-production) to make sure that configuration files are suited for production.

### Run Unit Tests with [Vitest](https://vitest.dev/)

Unit tests are not implemented yet.

```sh
npm run test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

End-to-end tests are not implemented yet.

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
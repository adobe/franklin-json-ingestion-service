# Franklin JSON Ingestion Service

> An example library to be used in and with Project Franklin

See also:

- https://github.com/adobe/franklin-fragment-ingestor
- https://github.com/adobe/franklin-query-service

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/franklin-json-ingestion-service.svg)](https://codecov.io/gh/adobe/franklin-json-ingestion-service)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/franklin-json-ingestion-service.svg)](https://circleci.com/gh/adobe/franklin-json-ingestion-service)
[![GitHub license](https://img.shields.io/github/license/adobe/franklin-json-ingestion-service.svg)](https://github.com/adobe/franklin-json-ingestion-service/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/franklin-json-ingestion-service.svg)](https://github.com/adobe/franklin-json-ingestion-service/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/franklin-json-ingestion-service.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/franklin-json-ingestion-service)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Installation

## Usage

```bash
# to be fixed...
# curl https://helix-pages.anywhere.run/franklin-services/franklin-json-ingestion-service@v1

curl https://txw6tavv82.execute-api.us-east-1.amazonaws.com/helix-services/json-ingestion-service/1.0.0
```

For more, see the [API documentation](docs/API.md).

## Development

### Run Function Locally

You can run a development server locally with:

```console
$ npm start
```

This starts a server at http://localhost:3000/. The node process is started with `--inspect` and you can
attach a debugger if needed.

### Run using localstack

You can also run with localstack to test the AWS Lambda integration locally. To do so, you need to install docker and docker-compose. Then you can run:

```
npm run deploy-localstack
```

which will prepare the files so it can work using localstack. Then you can run:

```
docker-compose up
```

It will make the deployed lambda function available at http://localhost:4566/restapis/testing/dev/_user_request_/endpoint

An sqs and s3 bucket is also then created and can be used to test the lambda function.

to tear down the stack, run:

```
docker-compose down
```

### Deploying Franklin JSON Ingestion Service

All commits to main that pass the testing will be deployed automatically. All commits to branches that will pass the testing will get commited as `/helix-services/service@ci<num>` and tagged with the CI build number.

## Static ip

This service is deployed on AWS Lambda and uses a static ip. The ip are `44.194.116.117` and `35.170.184.131`  and is used to whitelist the service in the firewall.

## Note on commit conventions
It uses [semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer) to decide to release or not on main branch. If commit message starts with "chore" it will not detect other messages (i.e fix, feat etc..). So make sure to remove chore in the merge messages.

#!/usr/bin/env bash
API_NAME=franklin
REGION=us-east-1
STAGE=dev

function fail() {
    echo $2
    exit $1
}

awslocal lambda create-function \
    --region ${REGION} \
    --function-name ${API_NAME} \
    --environment "Variables={SQS_QUEUE_URL=http://localhost:4566/000000000000/franklin-sqs-queue.fifo,NODE_OPTIONS=\"--trace-deprecation\"}" \
    --runtime nodejs16.x \
    --handler index.localstack \
    --timeout 180 \
    --memory-size 1024 \
    --zip-file fileb:///dist/localstack.zip \
    --role arn:aws:iam::123456123456:role/irrelevant

[ $? == 0 ] || fail 1 "Failed: AWS / lambda / create-function"

LAMBDA_ARN=$(awslocal lambda list-functions --query "Functions[?FunctionName==\`${API_NAME}\`].FunctionArn" --output text --region ${REGION})

echo LAMBDA_ARN=${LAMBDA_ARN}

awslocal apigateway create-rest-api \
    --region ${REGION} \
    --name ${API_NAME} \
    --tags '{"_custom_id_":"testing"}'

[ $? == 0 ] || fail 2 "Failed: AWS / apigateway / create-rest-api"

API_ID=$(awslocal apigateway get-rest-apis --query "items[?name==\`${API_NAME}\`].id" --output text --region ${REGION})
PARENT_RESOURCE_ID=$(awslocal apigateway get-resources --rest-api-id ${API_ID} --query 'items[?path==`/`].id' --output text --region ${REGION})

awslocal apigateway create-resource \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --parent-id ${PARENT_RESOURCE_ID} \
    --path-part "endpoint"

[ $? == 0 ] || fail 2 "Failed: AWS / apigateway / create-resource /endpoint"

RESOURCE_ID=$(awslocal apigateway get-resources --rest-api-id ${API_ID} --query 'items[?path==`/endpoint`].id' --output text --region ${REGION})

awslocal apigateway put-method \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --resource-id ${RESOURCE_ID} \
    --http-method ANY \
    --authorization-type "NONE"

[ $? == 0 ] || fail 4 "Failed: AWS / apigateway / put-method"

awslocal apigateway put-integration \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --resource-id ${RESOURCE_ID} \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations \
    --passthrough-behavior WHEN_NO_MATCH \

[ $? == 0 ] || fail 5 "Failed: AWS / apigateway / put-integration"

awslocal apigateway create-deployment \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --stage-name ${STAGE} \

[ $? == 0 ] || fail 6 "Failed: AWS / apigateway / create-deployment"

ENDPOINT=http://localhost:4566/restapis/testing/${STAGE}/_user_request_/endpoint
echo "API available at: ${ENDPOINT}"

#awslocal apigateway create-rest-api --name franklin-json-ingestor
#awslocal apigateway create-resource --rest-api-id franklin-json-ingestor --parent-id <parent-resource-id> --path-part myresource
#awslocal apigateway put-method --rest-api-id franklin-json-ingestor --resource-id <resource-id> --http-method POST --authorization-type NONE

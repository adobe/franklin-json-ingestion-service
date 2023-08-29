#!/usr/bin/env bash
awslocal sqs create-queue --queue-name franklin-sqs-queue.fifo --attributes FifoQueue=true,ContentBasedDeduplication=true
awslocal lambda create-event-source-mapping \
  --function-name franklin \
  --batch-size 1 \
  --event-source-arn arn:aws:sqs:us-east-1:000000000000:franklin-sqs-queue.fifo
#awslocal sqs send-message --queue-url http://localhost:4566/000000000000/franklin-sqs-queue.fifo --message-body "{ \"payload\": \"data\" }" --message-group-id frankin-ingestor

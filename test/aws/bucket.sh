#!/usr/bin/env bash
awslocal s3 mb s3://franklin-content-bus-headless
awslocal s3 cp /etc/localstack/init/ready.d/settings.json s3://franklin-content-bus-headless/localhost/settings.json

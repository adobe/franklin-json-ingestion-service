/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { SSMClient, PutParameterCommand, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SSM_PARAMETER_PREFIX } from './constants.js';

const ssmClient = new SSMClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
});

export async function putParameter(tenant, key, value) {
  const parameterName = `${SSM_PARAMETER_PREFIX}/${tenant}/${key}`;

  const params = {
    Name: parameterName,
    Value: value,
    Type: 'String',
    Overwrite: true,
  };

  const command = new PutParameterCommand(params);
  await ssmClient.send(command);
  return parameterName;
}

export async function getParameter(tenant, key) {
  const parameterName = `${SSM_PARAMETER_PREFIX}/${tenant}/${key}`;

  const params = {
    Name: parameterName,
    WithDecryption: true,
  };

  const command = new GetParameterCommand(params);
  const response = await ssmClient.send(command);
  if (response && response.Parameter) {
    return response.Parameter.Value;
  } else {
    throw new Error(`Parameter ${parameterName} not found`);
  }
}

/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import wrap from '@adobe/helix-shared-wrap';
import { logger } from '@adobe/helix-universal-logger';
import { wrap as status } from '@adobe/helix-status';
import { Response } from '@adobe/fetch';
import {DeleteObjectCommand, ListObjectsCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';

const VALID_MODES = ["preview", "live"];
const VALID_ACTIONS = ["store", "evict"];

/**
 * This is the main function
 * @param {Request} request the request object (see fetch api)
 * @param {UniversalContext} context the context of the universal serverless function
 * @returns {Response} a response
 */
async function run(request, context) {
  if (request.method !== 'POST') {
    return new Response(`Currently only POST is implemented`, { status: 400 });
  } else if (request.headers.get("Content-Type") !== 'application/json') {
    return new Response(`Invalid request content type please check the API for details`, { status: 400 });
  } else {
      try {
        const json = await request.json();
        context.log.info(`body: ${JSON.stringify(json)}`);
        const relPath = json.relPath;
        if (!relPath || typeof relPath !== 'string' || relPath.indexOf("/") === 0) {
          return new Response(`Invalid parameters relPath value, accept: a/b/c....`, { status: 400 });
        }
        const mode = json.mode || 'preview';
        if (!VALID_MODES.includes(mode)) {
          return new Response(`Invalid parameters mode value, accept:${VALID_MODES}`, { status: 400 });
        }
        const action = json.action || 'store';
        if (!VALID_ACTIONS.includes(action)) {
          return new Response(`Invalid parameters action value, accept:${VALID_ACTIONS}`, { status: 400 });
        }
        const variation = json.variation || 'master';
        const suffix = variation !== 'master' ? `.${variation}`:'';
        const s3 = new S3Client();
        const params = {
          Bucket: 'franklin-content-bus-headless',
          Key: `${mode}/${relPath}${suffix}.json`
        };
        if (action === 'store') {
          const payload = json.payload;
          if (!payload || typeof payload !== 'object') {
            return new Response(`Invalid parameters payload value, accept:{...} object`, { status: 400 });
          }
          try {
            params.Body = JSON.stringify(payload);
            await s3.send(new PutObjectCommand(params));
            return new Response(`${params.Key} stored in S3 bucket`);
          } catch (err) {
            return new Response(`An error occurred while trying to store ${params.Key} in S3 bucket`, { status: 500 });
          }
        } else {
          // then it can only be evict
          try {
            delete params.Key;
            params.Prefix = `${mode}/${relPath}.`;
            const listResponse = await s3.send(new ListObjectsCommand(params));
            delete params.Prefix;
            const deletedKeys = [];
            for (const item in listResponse.Contents) {
              params.Key = listResponse.Contents[item].Key;
              await s3.send(new DeleteObjectCommand(params));
              deletedKeys.push(params.Key);
            }
            if (deletedKeys.length > 0) {
              return new Response(`${deletedKeys} deleted in S3 bucket`);
            } else {
              return new Response(`Nothing to delete in S3 bucket`);
            }
          } catch (err) {
            return new Response(`An error occurred while trying to delete ${params.Key} in S3 bucket`, { status: 500 });
          }
        }
      } catch (parseError) {
        return new Response(`Error while parsing the body as json due to ${parseError}`, { status: 400 });
      }
  }
}

export const main = wrap(run)
  .with(status)
  .with(logger);

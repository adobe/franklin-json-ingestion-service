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
import {
  DeleteObjectCommand, ListObjectsCommand, PutObjectCommand, CopyObjectCommand, S3Client,
} from '@aws-sdk/client-s3';

const VALID_MODES = ['preview', 'live'];
const VALID_ACTIONS = ['store', 'evict'];
const buildDefaultParams = () => ({
  Bucket: 'franklin-content-bus-headless',
});

const deleteItemAction = (s3, key, deletedKeys) => new Promise((resolve, reject) => {
  const params = buildDefaultParams();
  params.Key = key;
  s3.send(new DeleteObjectCommand(params)).then(
    (_) => {
      deletedKeys.push(params.Key);
      resolve();
    },
  ).catch((err) => {
    reject(err);
  });
});

const storeInPreview = async (s3, payload, options) => {
  if (!payload || typeof payload !== 'object') {
    return new Response('Invalid parameters payload value, accept:{...} object', { status: 400 });
  }

  const params = buildDefaultParams();
  params.Body = JSON.stringify(payload);
  params.Key = `${options.s3SourceObjectPath}${options.suffix}.json`;
  params.ContentType = 'application/json';
  params.Metadata = {
    variation: options.variation,
  };
  try {
    await s3.send(new PutObjectCommand(params));
    return new Response(`${params.Key} stored in S3 bucket`);
  } catch (err) {
    return new Response(`An error occurred while trying to store ${params.Key} in S3 bucket due to ${err.msg}`, { status: 500 });
  }
};

const copyPreviewToLive = async (s3, options) => {
  const params = buildDefaultParams();
  params.CopySource = encodeURI(`${params.Bucket}/${options.s3SourceObjectPath}${options.suffix}.json`);
  params.Key = `${options.s3TargetObjectPath}`;
  try {
    await s3.send(new CopyObjectCommand(params));
    return new Response(`${params.Key} copy preview to live in S3 bucket`);
  } catch (err) {
    return new Response(`An error occurred while trying to copy ${params.CopySource}  to ${params.Key} in S3 bucket due to ${err.msg}`, { status: 500 });
  }
};

const evictFromS3 = async (s3, s3ObjectPath) => {
  // then it can only be evict
  try {
    const params = buildDefaultParams();
    params.Prefix = `${s3ObjectPath}.`;
    const listResponse = await s3.send(new ListObjectsCommand(params));
    delete params.Prefix;
    const deletedKeys = [];
    const promises = [];
    for (const item of listResponse.Contents) {
      promises.push(deleteItemAction(s3, item.Key, deletedKeys));
    }
    await Promise.all(promises);
    if (deletedKeys.length > 0) {
      return new Response(`${deletedKeys} deleted in S3 bucket`);
    } else {
      return new Response('Nothing to delete in S3 bucket');
    }
  } catch (err) {
    return new Response('An error occurred while trying to delete a key in S3 bucket', { status: 500 });
  }
};

/**
 * This is the main function
 * @param {Request} request the request object (see fetch api)
 * @param {UniversalContext} context the context of the universal serverless function
 * @returns {Response} a response
 */
async function run(request, context) {
  if (request.method !== 'POST') {
    return new Response('Currently only POST is implemented', { status: 405 });
  } else if (request.headers.get('Content-Type') !== 'application/json') {
    return new Response('Invalid request content type please check the API for details', { status: 400 });
  } else {
    try {
      const json = await request.json();
      context.log.info(`body: ${JSON.stringify(json)}`);
      const { tenant } = json;
      if (!tenant || !tenant.match(/[a-zA-Z0-9]*/g)) {
        return new Response('Invalid parameters tenantId value, accept: [a..zA-Z0-9]', { status: 400 });
      }
      const { relPath } = json;
      if (!relPath || typeof relPath !== 'string' || relPath.indexOf('/') === 0) {
        return new Response('Invalid parameters relPath value, accept: a/b/c....', { status: 400 });
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
      const suffix = variation !== 'master' ? `.${variation}` : '';
      const s3 = new S3Client();
      const s3SourceObjectPath = `${tenant}/preview/${relPath}`;
      const s3TargetObjectPath = `${tenant}/live/${relPath}`;
      const { payload } = json;

      if (mode === 'live') {
        // Either copy from preview or remove object
        if (action === 'store') {
          return copyPreviewToLive(s3, {
            s3SourceObjectPath,
            s3TargetObjectPath,
            suffix,
          });
        } else {
          // evict from live
          return evictFromS3(s3, s3TargetObjectPath);
        }
      } else if (action === 'store') {
        // store to preview
        return storeInPreview(s3, payload, {
          suffix,
          s3SourceObjectPath,
          variation,
        });
      } else {
        // evict from live and preview
        return evictFromS3(s3, s3SourceObjectPath);
      }
    } catch (parseError) {
      return new Response(`Error while parsing the body as json due to ${parseError}`, { status: 400 });
    }
  }
}

export const main = wrap(run)
  .with(status)
  .with(logger);

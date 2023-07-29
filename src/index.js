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
import { helixStatus } from '@adobe/helix-status';
import { Response } from '@adobe/fetch';
import Storage from './storage.js';
import RequestUtil from './request-util.js';
import InvalidateClient from './invalidate-client.js';
import { cleanupVariations, extractVariations } from './utils.js';

/**
 * This is the main function
 * @param {Request} request the request object (see fetch api)
 * @param {UniversalContext} context the context of the universal serverless function
 * @returns {Response} a response
 */
async function run(request, context) {
  const requestUtil = new RequestUtil(request);
  await requestUtil.validate();

  if (!requestUtil.isValid) {
    return new Response(requestUtil.errorMessage, { status: requestUtil.errorStatusCode });
  }

  const {
    action, mode, tenant, relPath, payload, variation, keptVariations,
  } = requestUtil;

  const storage = new Storage(context);
  const s3PreviewObjectPath = `${tenant}/preview/${relPath}`;
  const s3LiveObjectPath = `${tenant}/live/${relPath}`;
  const suffix = variation ? `/variations/${variation}` : '';
  const selection = '.cfm.gql';
  const s3ObjectPath = mode === 'live' ? s3LiveObjectPath : s3PreviewObjectPath;

  if (action === 'store') {
    // store to preview
    const storedKey = `${s3ObjectPath}${selection}.json${suffix}`;
    const k = await storage.putKey(
      storedKey,
      payload,
      variation,
    );
    context.log.info(`putKey ${storedKey} success`);
    await new InvalidateClient(context).invalidate(`${s3ObjectPath}${selection}.json`, variation);
    return new Response(`${k} stored`);
  } else if (action === 'cleanup') {
    const evictedVariationsKeys = await cleanupVariations(storage, s3ObjectPath, `${selection}.json`, keptVariations);
    await new InvalidateClient(context).invalidateVariations(
      `${s3ObjectPath}${selection}.json`,
      extractVariations(evictedVariationsKeys, selection),
    );
    if (evictedVariationsKeys.length > 0) {
      return new Response(`${evictedVariationsKeys.map((i) => i.Key).join(',')} evicted`);
    } else {
      return new Response('no variations found, so nothing to got evicted');
    }
  } else {
    const evictedKeys = [];
    evictedKeys.push(...await storage.evictKeys(s3ObjectPath, `${selection}.json`));
    await new InvalidateClient(context).invalidateAll(
      evictedKeys,
      selection,
    );
    return new Response(`${evictedKeys.map((i) => i.Key).join(',')} evicted`);
  }
}

export const main = wrap(run)
  .with(helixStatus)
  .with(logger);

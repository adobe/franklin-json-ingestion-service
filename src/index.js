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
import Storage from './storage.js';
import { renderFullyHydrated } from './fullyhydrated.js';
import RequestUtil from './request-util.js';

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
    action, mode, selector, tenant, relPath, payload, variation,
  } = requestUtil;

  const storage = new Storage(context);
  const s3PreviewObjectPath = `${tenant}/preview/${relPath}`;
  const s3LiveObjectPath = `${tenant}/live/${relPath}`;
  const selection = selector ? `.${selector}` : '';
  const suffix = variation ? `/variations/${variation}` : '';

  try {
    if (action === 'store') {
      if (mode === 'live') {
        const sourceKey = `${s3PreviewObjectPath}${selection}.json${suffix}`;
        const targetKey = `${s3LiveObjectPath}${selection}.json${suffix}`;
        const k = await storage.copyKey(
          sourceKey,
          targetKey,
        );
        context.log.info(`copyKey from ${sourceKey} to ${targetKey} success`);
        if (selector === 'franklin') {
          // generate the fully hydrated right after
          await renderFullyHydrated(context, s3LiveObjectPath, variation);
        }
        return new Response(`${k} stored`);
      } else {
        // store to preview
        const storedKey = `${s3PreviewObjectPath}${selection}.json${suffix}`;
        const k = await storage.putKey(
          storedKey,
          payload,
          variation,
        );
        context.log.info(`putKey ${storedKey} success`);
        if (selector === 'franklin') {
          // generate the fully hydrated right after
          await renderFullyHydrated(context, s3PreviewObjectPath, variation);
        }
        return new Response(`${k} stored`);
      }
    } else if (action === 'touch') {
      const baseKey = mode === 'live' ? s3LiveObjectPath : s3PreviewObjectPath;
      const touchKey = `${baseKey}${selection}.json${suffix}`;
      if (selector === 'franklin') {
        // generate the fully hydrated right after
        await renderFullyHydrated(context, touchKey, variation);
      }
      return new Response(`${touchKey} touched`);
    } else {
      const evictKeysPrefix = mode === 'live' ? s3LiveObjectPath : s3PreviewObjectPath;
      const ks = await storage.evictKeys(`${evictKeysPrefix}${selection}.json`);
      return new Response(`${ks.map((i) => i.Key).join(',')} evicted`);
    }
  } catch (err) {
    return new Response(`${err.message}`, { status: 500 });
  }
}

export const main = wrap(run)
  .with(status)
  .with(logger);

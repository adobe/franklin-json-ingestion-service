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

const VALID_MODES = ['preview', 'live'];
const VALID_ACTIONS = ['store', 'evict'];

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
    let json;

    try {
      json = await request.json();
    } catch (parseError) {
      return new Response(`Error while parsing the body as json due to ${parseError.message}`, { status: 400 });
    }

    context.log.info(`body: ${JSON.stringify(json)}`);
    const { tenant } = json;
    if (!tenant || !tenant.match(/^[a-zA-Z0-9\-_]*$/g)) {
      return new Response('Invalid parameters tenantId value, accept: [a..zA-Z0-9\\-_]', { status: 400 });
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
    const { variation } = json;
    const suffix = variation ? `.${variation}` : '';
    const storage = new Storage();
    const s3PreviewObjectPath = `${tenant}/preview/${relPath}`;
    const s3LiveObjectPath = `${tenant}/live/${relPath}`;
    const { payload } = json;

    try {
      if (action === 'store') {
        if (mode === 'live') {
          const k = await storage.copyKey(
            `${s3PreviewObjectPath}${suffix}.json`,
            `${s3LiveObjectPath}${suffix}.json`,
          );
          return new Response(`${k} stored`);
        } else {
          // store to preview
          const k = await storage.putKey(
            `${s3PreviewObjectPath}${suffix}.json`,
            payload,
            variation,
          );
          return new Response(`${k} stored`);
        }
      } else {
        const ks = await storage.evictKeys(mode === 'live' ? s3LiveObjectPath : s3PreviewObjectPath);
        return new Response(`${ks.map((i) => i.Key).join(',')} evicted`);
      }
    } catch (err) {
      return new Response(`${err.message}`, { status: 500 });
    }
  }
}

export const main = wrap(run)
  .with(status)
  .with(logger);

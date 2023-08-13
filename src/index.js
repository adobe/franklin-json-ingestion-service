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
import {
  extractS3ObjectPath,
  validSettings,
} from './utils.js';
import PullingClient from './pulling-client.js';
import VariationsUtil from './variations-util.js';

/**
 * This is the main function
 * @param {Request} request the request object (see fetch api)
 * @param {UniversalContext} context the context of the universal serverless function
 * @returns {Response} a response
 */

const globalContent = {};

async function run(request, context) {
  const endpoint = process.env.SERVER_ENDPOINT_URL || request.url;
  const requestUtil = new RequestUtil(request);
  await requestUtil.validate();

  if (!requestUtil.isValid) {
    return new Response(requestUtil.errorMessage, { status: requestUtil.errorStatusCode });
  }

  const {
    action, mode, tenant, relPath, payload, variation,
  } = requestUtil;

  const storage = new Storage(context);
  const suffix = variation ? `/variations/${variation}` : '';
  const s3ObjectPath = extractS3ObjectPath(requestUtil);

  if (action === 'store') {
    let data = payload;
    if (!data) {
      // init globalContext for given tenant
      if (!globalContent[tenant]) {
        try {
          globalContent[tenant] = await storage.getKey(`${tenant}/settings.json`);
        } catch (e) {
          context.log.error(`Error while fetching settings for tenant ${tenant} due to ${e.message}`);
          return new Response('Please call settings action to setup pulling client', { status: 400 });
        }
      }
      const settings = globalContent[tenant];
      data = await new PullingClient(
        context,
        settings[mode].baseURL,
        settings[mode].authorization,
      ).pullContent(relPath, variation);
    }
    if (data) {
      const storedKey = `${s3ObjectPath}.cfm.gql.json${suffix}`;
      const k = await storage.putKey(
        storedKey,
        data,
        variation,
      );
      context.log.info(`putKey ${storedKey} success`);
      await new InvalidateClient(context).invalidate(`${s3ObjectPath}.cfm.gql.json`, variation);
      if (!variation) {
        await new VariationsUtil(
          context,
          endpoint,
          requestUtil,
        ).process(data, requestUtil);
      }
      return new Response(`${k} stored`);
    } else {
      return new Response('Empty data, nothing to store', { status: 400 });
    }
  } else if (action === 'settings') {
    const key = `${tenant}/settings.json`;
    if (payload && validSettings(payload)) {
      await storage.putKey(key, payload);
      globalContent[tenant] = payload;
      return new Response(`settings stored under ${key}`);
    } else {
      return new Response('Invalid settings value', { status: 400 });
    }
  } else {
    const evictedKeys = [];
    evictedKeys.push(...await storage.evictKeys(s3ObjectPath));
    await new InvalidateClient(context).invalidateAll(
      evictedKeys,
    );
    return new Response(`${evictedKeys.map((i) => i.Key).join(',')} evicted`);
  }
}

export const main = wrap(run)
  .with(helixStatus)
  .with(logger);

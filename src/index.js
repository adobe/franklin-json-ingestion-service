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
import {
  cloneObject, processSequence,
  validSettings,
} from './utils.js';
import { sendMessage, processMessage } from './sqs-util.js';

/**
 * This is the main function
 * @param {Request} request the request object (see fetch api)
 * @param {UniversalContext} context the context of the universal serverless function
 * @returns {Response} a response
 */

const cachedSettings = {};

async function httpHandler(request, context) {
  const requestUtil = new RequestUtil(request);
  await requestUtil.validate();

  if (!requestUtil.isValid) {
    return new Response(requestUtil.errorMessage, { status: requestUtil.errorStatusCode });
  }

  const {
    action, payload, tenant, mode, variation,
  } = requestUtil;

  const storage = new Storage(context);
  if (action === 'store' || action === 'evict') {
    if (!variation) {
      await sendMessage(requestUtil.toMessage(), `${tenant}-${mode}`);
      return new Response(`processing ${action} in background`);
    } else {
      return new Response('parameter variation is deprecated, ignoring request now');
    }
  } else if (action === 'cleanup') {
    return new Response('cleanup is deprecated, ignored for now');
  } else {
    const key = `${tenant}/settings.json`;
    if (payload && validSettings(payload)) {
      await storage.putKey(key, payload);
      context.cachedSettings[tenant] = payload;
      return new Response(`settings stored under ${key}`);
    } else {
      return new Response('Invalid settings value', { status: 400 });
    }
  }
}

async function run(event, context) {
  const { records } = context;
  // attach cachedSettings to context so it can be access by other functions
  context.cachedSettings = cachedSettings;
  if (records) {
    // invoked by SQS trigger, with configured timeout
    // order matter here, we need to process records in order
    await processSequence(cloneObject(records), async (record) => {
      await processMessage(context, JSON.parse(record.body));
    });
    return new Response('ok');
  } else {
    return httpHandler(event, context);
  }
}

export const main = wrap(run)
  .with(helixStatus)
  .with(logger);

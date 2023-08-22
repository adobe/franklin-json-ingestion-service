/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { fetch } from '@adobe/fetch';
import processQueue from '@adobe/helix-shared-process-queue';
import {
  cleanupVariations, cloneObject, collectVariations, extractS3ObjectPath, extractVariations,
} from './utils.js';
import Storage from './storage.js';
import { APPLICATION_JSON } from './constants.js';
import InvalidateClient from './invalidate-client.js';

export default class VariationsUtil {
  constructor(context, baseURL, requestUtil) {
    this.context = context || { log: console };
    this.baseURL = baseURL;
    this.requestUtil = requestUtil;
  }

  async process(data) {
    const s3ObjectPath = extractS3ObjectPath(this.requestUtil);
    const variations = Array.from(collectVariations(data));
    // cleanup non existing variations
    const evictedVariationsKeys = await cleanupVariations(
      new Storage(this.context),
      s3ObjectPath,
      variations,
    );
    await new InvalidateClient(this.context).invalidateVariations(
      `${s3ObjectPath}.cfm.gql.json`,
      extractVariations(evictedVariationsKeys),
    );
    // then store re-variations existing ones
    const contextObj = this.context;
    await processQueue(cloneObject(variations), async (variation) => {
      const options = {
        method: 'POST',
        headers: { 'content-type': APPLICATION_JSON },
        body: {
          action: 'store',
          tenant: this.requestUtil.tenant,
          mode: this.requestUtil.mode,
          relPath: this.requestUtil.relPath,
          variation,
        },
      };
      contextObj.log.info('invoking lambda for variation ', variation);
      await fetch(this.baseURL, options).catch((err) => {
        contextObj.log.error(`Error while doing call to store variation: ${variation} due to ${err.message} for ${this.baseURL}`);
      });
    });
  }
}

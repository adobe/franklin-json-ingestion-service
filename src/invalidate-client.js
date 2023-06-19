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
import { cloneObject, extractRootKey, extractVariation } from './utils.js';

export default class InvalidateClient {
  constructor(context) {
    this.context = context || { log: console };
    this.baseURL = this.context.env && this.context.env.INVALIDATION_ENDPOINT ? this.context.env.INVALIDATION_ENDPOINT : 'http://localhost/endpoint';
  }

  async invalidate(key, variation) {
    let success = false;
    try {
      const method = 'POST';
      const body = {
        event: {
          type: 's3',
          file: `/${key}`,
        },
      };
      if (variation && variation !== '') {
        body.event.variation = variation;
      }
      const response = await fetch(this.baseURL, { method, body });
      if (response.status === 200) {
        this.context.log.info(`invalidated key=${key} variation=${variation} success`);
        success = true;
      } else {
        this.context.log.error(`invalidate key=${key} variation=${variation} failed due to ${response.status} code`);
      }
    } catch (err) {
      this.context.log.error(`invalidate failed due to ${err.message}`);
    }
    return success;
  }

  async invalidateAll(s3Keys, selection) {
    const thisClient = this;
    return processQueue(cloneObject(s3Keys), async (s3Key) => {
      let result;
      if (s3Key) {
        const key = s3Key.Key;
        if (key) {
          const rootKey = extractRootKey(key, selection);
          const variation = extractVariation(key, selection);
          const value = await thisClient.invalidate(rootKey, variation);
          result = { key: rootKey, value, variation };
        }
      }
      return result;
    });
  }

  async invalidateVariations(rootKey, variations) {
    const thisClient = this;
    return processQueue(cloneObject(variations), async (variation) => {
      let result;
      if (variation) {
        const value = await thisClient.invalidate(rootKey, variation);
        result = { rootKey, value, variation };
      }
      return result;
    });
  }
}

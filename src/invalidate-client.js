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
import { cloneObject } from './utils.js';

export default class InvalidateClient {
  constructor(context) {
    this.context = context || { log: console };
    this.baseURL = this.context.env && this.context.env.INVALIDATION_ENDPOINT ? this.context.env.INVALIDATION_ENDPOINT : 'http://localhost/endpoint';
  }

  async invalidate(key, variation) {
    try {
      const method = 'POST';
      const body = {
        event: {
          type: 's3',
          file: `/${key}`,
        },
      };
      if (variation !== '') {
        body.event.variation = variation;
      }
      const response = await fetch(this.baseURL, { method, body });
      if (response.status === 200) {
        this.context.log.info(`invalidated ${key} success`);
        return true;
      }
    } catch (err) {
      this.context.log.error(`invalidate failed due to ${err.message}`);
    }
    return false;
  }

  async invalidateAll(keys, variation) {
    const thisClient = this;
    return processQueue(cloneObject(keys), async (key) => {
      let result;
      if (key) {
        const value = await thisClient.invalidate(key, variation);
        result = { key, value };
      }
      return result;
    });
  }
}

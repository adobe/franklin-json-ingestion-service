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
import processQueue from '@adobe/helix-shared-process-queue';
import Storage from './storage.js';
import { PN_MODEL, PN_PATH } from './constants.js';
import {
  cloneObject,
  collectReferences,
  createReferenceToObjectMapping,
  extractCFReferencesProperties, replaceRefsWithObject,
} from './utils.js';

export default class FullyHydrated {
  /**
     * This is the main function
     * @param {UniversalContext} context the context of the universal serverless function
     * @param {string} key the key (without .json etc..) for the S3 resource to be fully hydrated.
     * @param {string} variation the variation name (i.e max_22 etc... to render it from, optional.
     */
  constructor(context, key, variation) {
    this.context = context;
    this.storage = new Storage(context);
    this.context = context;
    this.key = key;
    this.variation = variation;
    this.cacheKey = this.computeCacheKey();
    const keySplit = this.key.split('/');
    this.prefix = `${keySplit[0]}/${keySplit[1]}`;
  }

  computeCacheKey() {
    return `${this.computeDerivedKey(this.variation)}/fully`;
  }

  async getCachedJson() {
    try {
      this.context.log.info(`getCachedJson cacheKey=${this.cacheKey}`);
      return await this.storage.getKey(this.cacheKey);
    } catch (err) {
      this.context.log.info(`No cache for ${this.cacheKey} found`);
    }
    return null;
  }

  /**
     * This is the main function
     * @return {Object} parsed json object or undefined if not found.
     */
  async getFullyHydrated(force) {
    this.context.log.info(`getFullyHydrated key=${this.key} variation=${this.variation}`);
    if (!force) {
      const cachedJson = await this.getCachedJson();
      if (cachedJson) {
        this.context.log.info(`${this.key} returned from cache`);
        return cachedJson;
      }
    }
    const mainJson = await this.computeFullyHydrated();
    if (mainJson) {
      this.context.log.info(`Using storage to cacheKey=${this.cacheKey}`);
      try {
        await this.storage.putKey(this.cacheKey, mainJson, 'cfm.gql.cache');
      } catch (err) {
        this.context.log.warn(`Cache ${this.cacheKey} failed to be persisted on storage due to ${err.message}`);
      }
    }
    return mainJson;
  }

  computeDerivedKey(variation) {
    return variation ? `${this.key}.franklin.json/variations/${variation}` : `${this.key}.franklin.json`;
  }

  extractModelPath(jsonObj) {
    const modelPath = jsonObj[PN_MODEL][PN_PATH];
    return `${this.prefix}${modelPath}`;
  }

  async getModel(key) {
    try {
      return await this.storage.getKey(key);
    } catch (err) {
      this.context.log.error(`Could not load model for ${key} due to ${err.message}`);
    }
    return null;
  }

  async computeFullyHydrated() {
    this.context.log.info(`computeFullyHydrated key=${this.key} variation=${this.variation}`);
    let mainJson;
    try {
      mainJson = await this.storage.getKey(`${this.computeDerivedKey(this.variation)}`);
    } catch (err) {
      // fallback on main variation
      if (this.variation) {
        this.context.log.info(`Using fallback mechanism to get the key ${this.key}`);
        mainJson = await this.storage.getKey(this.computeDerivedKey());
      } else {
        return null;
      }
    }
    // read model json from storage
    const modelKey = `${this.extractModelPath(mainJson)}.franklin.json`;
    const modelJson = await this.getModel(modelKey);
    if (!modelJson) {
      this.context.log.warn(`Cannot find model ${modelKey} for ${this.key}`);
      return null;
    }
    const referencesProperties = extractCFReferencesProperties(modelJson);
    const collectedReferences = collectReferences(referencesProperties, mainJson);
    const results = await this.loadFullyHydratedFromReferences(collectedReferences);
    const refsObjMap = createReferenceToObjectMapping(results);
    replaceRefsWithObject(referencesProperties, mainJson, refsObjMap);
    return mainJson;
  }

  async loadFullyHydratedFromReferences(refs) {
    return processQueue(cloneObject(refs), async (ref) => {
      let result;
      if (ref) {
        const value = await new FullyHydrated(this.context, `${this.prefix}${ref}`, this.variation).getFullyHydrated();
        result = { ref, value };
      }
      return result;
    });
  }
}

export async function renderFullyHydrated(context, key, variation) {
  if (key.indexOf('_models_') >= 0) {
    return;
  }
  const startTime = Date.now();
  await new FullyHydrated(
    context,
    key,
    variation,
  ).getFullyHydrated(true);
  const endTime = Date.now();
  const deltaTime = endTime - startTime;
  context.log.info(`getFullyHydrated for ${key} took ${deltaTime} ms`);
}

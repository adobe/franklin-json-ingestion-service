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

import SlackClient from './slack-client.js';
import { SLACK_URL, SUFFIX } from './constants.js';

export function cloneObject(object) {
  return JSON.parse(JSON.stringify(object));
}

export function extractCFReferencesProperties(modelJson) {
  const result = [];
  for (const [key, value] of Object.entries(modelJson.properties)) {
    if (value.anyOf || (value.type === 'array' && value.items.anyOf)) {
      result.push(key);
    }
  }
  return result;
}

export function replaceRefsWithObject(propKeys, target, referenceToObjectMapping) {
  const finalObject = target;
  propKeys.forEach((propKey) => {
    const ref = finalObject[propKey];
    const refType = typeof ref;
    if (refType === 'string') {
      const referencedObject = referenceToObjectMapping[ref];
      if (referencedObject) {
        finalObject[propKey] = referencedObject;
      } else {
        // remove references that are not solved
        delete finalObject[propKey];
      }
    } else if (Array.isArray(ref)) {
      const newArray = [];
      ref.forEach((relPath) => {
        const referencedObject = referenceToObjectMapping[relPath];
        if (referencedObject) {
          // copy resolved references only
          newArray.push(referencedObject);
        }
      });
      finalObject[propKey] = newArray;
    }
  });
}

export function createReferenceToObjectMapping(results) {
  const refsObjMap = {};
  results.forEach((entry) => {
    const { ref, value } = entry;
    refsObjMap[ref] = value;
  });
  return refsObjMap;
}

export function collectReferences(refProperties, mainJson) {
  const collectedReferences = new Set();
  refProperties.forEach((propKey) => {
    const propValue = mainJson[propKey];
    const refType = typeof propValue;
    if (refType === 'string') {
      collectedReferences.add(propValue);
    } else if (Array.isArray(propValue)) {
      propValue.forEach((relPath) => {
        collectedReferences.add(relPath);
      });
    }
  });
  return Array.from(collectedReferences);
}

export function filterVariationsKeys(keys, keptVariations) {
  const excludeList = keptVariations || [];
  if (Array.isArray(keys)) {
    return keys.filter((o) => {
      const key = o.Key;
      if (key) {
        return !excludeList.some((v) => key.endsWith(`.json/variations/${v}`));
      } else {
        return false;
      }
    });
  } else {
    return keys;
  }
}

export async function cleanupVariations(storage, prefix, variations) {
  const allVariationsKeys = await storage.listKeys(`${prefix}${SUFFIX}/variations/`);
  const toEvictKeys = filterVariationsKeys(allVariationsKeys, variations);
  return storage.deleteKeys(toEvictKeys);
}

export function extractRootKey(key) {
  const idx = key.indexOf(SUFFIX);
  return idx >= 0 ? `${key.substring(0, idx + SUFFIX.length)}` : null;
}

export function extractVariation(key) {
  const pattern = `${SUFFIX}/variations/`;
  const idx = key.indexOf(pattern);
  return idx >= 0 ? `${key.substring(idx + pattern.length)}` : null;
}

export async function sendSlackMessage(slackToken, channelId, message) {
  if (slackToken && channelId) {
    await new SlackClient(SLACK_URL, slackToken)
      .postMessage(channelId, message);
    return true;
  } else {
    return false;
  }
}

export function isValidEmail(email) {
  return /^[^@]+@[^@]+$/.test(email);
}

export function isValidRelPath(relPath) {
  let isValid = false;
  function validatePath(path) {
    return typeof path === 'string' && path.indexOf('/') !== 0;
  }
  if (Array.isArray(relPath)) {
    for (const path of relPath) {
      isValid = validatePath(path);
      if (!isValid) {
        break;
      }
    }
  } else {
    isValid = validatePath(relPath);
  }
  return isValid;
}

export async function createConversation(slackToken, email) {
  if (slackToken && isValidEmail(email)) {
    const slackClient = new SlackClient(SLACK_URL, slackToken);
    try {
      const userId = await slackClient.findUserId(email);
      return slackClient.createConversation(userId);
    } catch (err) {
      return process.env.SLACK_FALLBACK_CHANNEL_ID;
    }
  }
  return null;
}

export function extractVariations(s3Keys) {
  return s3Keys.map((entry) => {
    const key = entry.Key;
    if (key) {
      return extractVariation(key);
    } else {
      return null;
    }
  }).filter((value) => value != null);
}

export function validSettings(payload) {
  return payload && payload.live && payload.preview
      && payload.live.baseURL.match(/https?:\/\/[^/]+/)
      && payload.preview.baseURL.match(/https?:\/\/[^/]+/);
}

export function collectVariations(data) {
  const variations = new Set();
  Object.keys(data).forEach((key) => {
    if (key === '_variations') {
      data[key].forEach((variation) => {
        variations.add(variation);
      });
    } else {
      const value = data[key];
      if (value) {
        if (typeof value === 'object') {
          collectVariations(value).forEach((variation) => {
            variations.add(variation);
          });
        }
      }
    }
  });
  return variations;
}

export async function processSequence(records, fn) {
  const record = records.shift();
  if (record) {
    await fn(record);
    await processSequence(records, fn);
  }
}
export function extractS3ObjectPath(obj) {
  const { tenant, mode, relPath } = obj;
  const s3PreviewObjectPath = `${tenant}/preview/${relPath}`;
  const s3LiveObjectPath = `${tenant}/live/${relPath}`;
  return mode === 'live' ? s3LiveObjectPath : s3PreviewObjectPath;
}

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
      }
    } else if (Array.isArray(ref)) {
      const newArray = [];
      ref.forEach((relPath) => {
        const referencedObject = referenceToObjectMapping[relPath];
        if (referencedObject) {
          newArray.push(referencedObject);
        } else {
          newArray.push(relPath);
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

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
/* eslint-env mocha */
import assert from 'assert';
import {
  collectReferences,
  createReferenceToObjectMapping,
  extractCFReferencesProperties,
  replaceRefsWithObject,
} from '../src/utils.js';

describe('Utils Tests', () => {
  it('extractCFReferencesProperties ', () => {
    const actual = extractCFReferencesProperties({
      properties: {
        field1: {
          type: 'array',
          items: {
            anyOf: [{
              $dynamicRef: '#model1',
            }],
          },
        },
        field2: {
          type: 'object',
          anyOf: [{
            $dynamicRef: '#model1',
          }],
        },
        field3: {
          type: 'string',
        },
        field4: {
          type: 'boolean',
        },
        field5: {
          type: 'number',
        },
      },
    });
    const expected = [
      'field1',
      'field2',
    ];
    assert.deepEqual(expected, actual);
  });
  it('collectReferences based on list of references properties on the given object', () => {
    const collectedRefs = collectReferences(
      ['refField1', 'refField2'],
      {
        refField1: '/a/b/c',
        refField2: [
          '/e/f/g',
          '/h/i/j',
        ],
      },
    );
    const expected = [
      '/a/b/c',
      '/e/f/g',
      '/h/i/j',
    ];
    assert.strictEqual(JSON.stringify(collectedRefs), JSON.stringify(expected));
  });
  it('createReferenceToObjectMapping from results', () => {
    const mappedRefsObject = createReferenceToObjectMapping(
      [
        { ref: '/a/b/c', value: { test: 1 } },
        { ref: '/e/f/g', value: { test: 2 } },
        { ref: '/h/i/j', value: { test: 3 } },
      ],
    );
    const expected = {
      '/a/b/c': { test: 1 },
      '/e/f/g': { test: 2 },
      '/h/i/j': { test: 3 },
    };
    assert.strictEqual(JSON.stringify(mappedRefsObject), JSON.stringify(expected));
  });
  it('extractCFReferencesProperties from modelJson', () => {
    const mappedRefsObject = createReferenceToObjectMapping(
      [
        { ref: '/a/b/c', value: { test: 1 } },
        { ref: '/e/f/g', value: { test: 2 } },
        { ref: '/h/i/j', value: { test: 3 } },
      ],
    );
    const expected = {
      '/a/b/c': { test: 1 },
      '/e/f/g': { test: 2 },
      '/h/i/j': { test: 3 },
    };
    assert.strictEqual(JSON.stringify(mappedRefsObject), JSON.stringify(expected));
  });
  it('replaceRefsWithObject with values', () => {
    const map = {
      '/a/b/c': { test: 1 },
      '/e/f/g': { test: 2 },
      '/h/i/j': { test: 3 },
    };
    const targetObject = {
      field1: [
        '/a/b/c',
        '/h/i/j',
      ],
      field2: '/e/f/g',
      field3: '/e/f/g',
    };

    replaceRefsWithObject(
      [
        'field1', 'field2',
      ],
      targetObject,
      map,
    );
    const expected = {
      field1: [
        { test: 1 },
        { test: 3 },
      ],
      field2: { test: 2 },
      field3: '/e/f/g',
    };
    assert.deepEqual(targetObject, expected);
  });
  it('replaceRefsWithObject with values and unresolved ref', () => {
    const map = {
      '/a/b/c': { test: 1 },
      '/h/i/j': { test: 3 },
    };
    const targetObject = {
      field1: [
        '/a/b/c',
        '/e/f/g',
        '/h/i/j',
      ],
      field2: '/e/f/g',
      field3: '/e/f/g',
    };

    replaceRefsWithObject(
      [
        'field1', 'field2',
      ],
      targetObject,
      map,
    );
    const expected = {
      field1: [
        { test: 1 },
        '/e/f/g',
        { test: 3 },
      ],
      field2: '/e/f/g',
      field3: '/e/f/g',
    };
    assert.deepEqual(targetObject, expected);
  });
});

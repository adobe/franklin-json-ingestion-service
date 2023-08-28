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
import nock from 'nock';
import {
  collectReferences,
  createReferenceToObjectMapping,
  extractCFReferencesProperties,
  replaceRefsWithObject,
  filterVariationsKeys,
  extractVariations, extractVariation, extractRootKey, collectVariations, sendSlackMessage,
  setupSlack,
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
        { test: 3 },
      ],
      field3: '/e/f/g',
    };
    assert.deepEqual(targetObject, expected);
  });
  it('filterVariationsKeys from keys using keptVariations', () => {
    const sampleVariationsKeys = [
      { Key: 'tenant/preview/a/b.cfm.gql.json/variations/var1' },
      { Key: 'tenant/preview/a/b.cfm.gql.json/variations/var2' },
      { Key: 'tenant/preview/a/b.cfm.gql.json/variations/var3' },
    ];
    const test1 = filterVariationsKeys(sampleVariationsKeys, ['var1', 'var3']);
    assert.strictEqual(JSON.stringify(test1), JSON.stringify([{ Key: 'tenant/preview/a/b.cfm.gql.json/variations/var2' }]));
    const test2 = filterVariationsKeys(sampleVariationsKeys, ['']);
    assert.strictEqual(JSON.stringify(test2), JSON.stringify(sampleVariationsKeys));
    const test3 = filterVariationsKeys([{ Key: '/a/b/null' }], [null]);
    assert.strictEqual(JSON.stringify(test3), JSON.stringify([{ Key: '/a/b/null' }]));
    const test4 = filterVariationsKeys([{ Key: '/a/b/c' }], null);
    assert.strictEqual(JSON.stringify(test4), JSON.stringify([{ Key: '/a/b/c' }]));
    const test5 = filterVariationsKeys(null, ['var1', 'var3']);
    assert.strictEqual(JSON.stringify(test5), JSON.stringify(null));
    const test6 = filterVariationsKeys([{ notKey: '/a/b/c' }], ['var1', 'var3']);
    assert.strictEqual(JSON.stringify(test6), JSON.stringify([]));
  });
  it('extractPrefix', () => {
    assert.strictEqual(extractVariation('local/preview/a/b/c.cfm.gql.json'), null);
    assert.strictEqual(extractVariation('local/preview/a/b/c.cfm.gql.json/variations/var1'), 'var1');
    assert.strictEqual(extractVariation('local/preview/a/b/c'), null);
  });
  it('extractVariation', async () => {
    assert.strictEqual(extractRootKey('local/preview/a/b/c.cfm.gql.json'), 'local/preview/a/b/c.cfm.gql.json');
    assert.strictEqual(extractRootKey('local/preview/a/b/c.cfm.gql.json/variations/var1'), 'local/preview/a/b/c.cfm.gql.json');
    assert.strictEqual(extractRootKey('local/preview/a/b/c'), null);
  });
  it('extractVariations', async () => {
    const s3Keys = [
      { Key: 'local/preview/a/b/c.cfm.gql.json/variations/var1' },
      { Key: 'local/preview/a/b/c.cfm.gql.json/variations/var2' },
      { Key: 'local/preview/a/b/c.cfm.gql.json' },
      { notKey: 'local/preview/a/b/c.cfm.gql.json/variations/var5' },
    ];
    const variations = await extractVariations(s3Keys);
    assert.strictEqual(JSON.stringify(variations), JSON.stringify(['var1', 'var2']));
  });
  it('collectVariations', async () => {
    const variations = Array.from(collectVariations({
      data: {
        _variations: [
          'var1',
          'var3',
        ],
        nested: {
          _variations: [
            'var5',
          ],
          multiple: [
            {
              _variations: ['var2'],
            },
            {
              _variations: ['var4'],
            },
          ],
        },
      },
    })).sort();
    assert.deepStrictEqual(variations, ['var1', 'var2', 'var3', 'var4', 'var5']);
  });
  it('sendSlackMessage', async () => {
    nock('http://slackcloudservice', {
      reqheaders: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dummyToken',
      },
    }).post('/api/chat.postMessage', (requestBody) => {
      assert.strictEqual(requestBody.channel, 'dummyChannelId');
      assert.strictEqual(requestBody.blocks[0].text.text, 'dummyMessage');
      return true;
    }).reply(200, { ok: true });
    await sendSlackMessage({
      slackChannelId: 'dummyChannelId',
      slackToken: 'dummyToken',
    }, 'dummyMessage');
  });
  describe('setupSlack', () => {
    it('success', async () => {
      nock('http://slackcloudservice', {
        reqheaders: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dummyToken',
        },
      }).post('/api/conversations.join', (requestBody) => {
        assert.strictEqual(requestBody.channel, 'dummyChannelId');
        return true;
      }).reply(200, { ok: true });
      await setupSlack({
        slackChannelId: 'dummyChannelId',
        slackToken: 'dummyToken',
      });
    });
    it('undefined settings', async () => {
      await setupSlack();
    });
  });
});

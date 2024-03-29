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

/* eslint-env mocha */
import assert from 'assert';
import nock from 'nock';
import InvalidateClient from '../src/invalidate-client.js';

describe('Invalidate Tests', () => {
  beforeEach(() => {
    nock.cleanAll();
    nock.restore();
    nock.activate();
  });
  it('invalidate success', async () => {
    nock('http://localhost')
      .post('/endpoint')
      .reply(200, {});
    const result = await new InvalidateClient({ log: console, env: { INVALIDATION_ENDPOINT: 'http://localhost/endpoint' } }).invalidate('some/key/test');
    assert.strictEqual(result, true);
  });
  it('invalidate success', async () => {
    nock('http://localhost')
      .post('/endpoint')
      .reply(200, {});
    const result = await new InvalidateClient().invalidate('some/key/test');
    assert.strictEqual(result, true);
  });
  it('invalidate variations success', async () => {
    nock('http://localhost')
      .post('/endpoint', (body) => body.event && body.event.variation.startsWith('var'))
      .times(2)
      .reply(200, {});
    const result = await new InvalidateClient()
      .invalidateVariations('some/key/test', ['var1', 'var2']);
    assert.strictEqual(
      JSON.stringify(result),
      JSON.stringify([
        { key: 'some/key/test', value: true, variation: 'var1' },
        { key: 'some/key/test', value: true, variation: 'var2' },
      ]),
    );
  });
  it('invalidate variations null', async () => {
    nock('http://localhost')
      .post('/endpoint')
      .reply(200, {});
    const result = await new InvalidateClient().invalidateVariations('some/key/test', [null]);
    assert.strictEqual(JSON.stringify(result), JSON.stringify([]));
  });
  it('invalidate failed unknown host', async () => {
    const result = await new InvalidateClient().invalidate('invalid/key/test');
    assert.strictEqual(result, false);
  });
  it('invalidate failed on 500', async () => {
    nock('http://localhost')
      .post('/endpoint')
      .reply(500, {});
    const result = await new InvalidateClient().invalidate('invalid/key/test');
    assert.strictEqual(result, false);
  });
  it('invalidateAll success', async () => {
    nock('http://localhost')
      .post('/endpoint')
      .times(2)
      .reply(200, {});
    const result = await new InvalidateClient(
      {
        log: console,
        env: {
          INVALIDATION_ENDPOINT: 'http://localhost/endpoint',
        },
      },
    ).invalidateAll(
      [
        { Key: 'some/key/test.cfm.gql.json' },
        { Key: 'some/key/test.cfm.gql.json/variations/var1' },
      ],
    );
    assert.deepEqual(
      result,
      [
        { key: 'some/key/test.cfm.gql.json', value: true, variation: null },
        { key: 'some/key/test.cfm.gql.json', value: true, variation: 'var1' },
      ],
    );
  });
});

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
import { Request } from '@adobe/fetch';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import nock from 'nock';
import { main } from '../src/index.js';
import { APPLICATION_JSON } from '../src/constants.js';

describe('Index Tests', () => {
  const authToken = '12345';
  const headers = { 'x-edge-authorization': `token ${authToken}` };
  const wrongHeaders = { 'x-edge-authorization': 'token bad' };
  let envCache;

  before(() => {
    envCache = process.env;
    process.env.EDGE_AUTH_TOKEN_1 = authToken;
  });

  after(() => {
    process.env = envCache;
  });

  it('do not allow wrong token', async () => {
    const result = await main(new Request('https://localhost/', { headers: wrongHeaders }), {});
    assert.strictEqual(await result.status, 401);
  });

  it('do not allow unauthorized', async () => {
    const result = await main(new Request('https://localhost/', {}), {});
    assert.strictEqual(await result.status, 401);
  });

  it('index function is present', async () => {
    const result = await main(new Request('https://localhost/', { headers }), {});
    assert.strictEqual(await result.status, 405);
  });
  it('only POST allowed', async () => {
    const result = await main(new Request('https://localhost/', { method: 'PUT', headers }), {});
    assert.strictEqual(await result.status, 405);
  });
  it('stores in preview as implicit operation', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 'a/b/c',
            payload: {
              test: 'value',
            },
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.json stored');
    assert.strictEqual(await result.status, 200);
  });
  it('stores in preview with selector parameter', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 'a/b/c',
            selector: 'cfm.gql',
            payload: {
              test: 'value',
            },
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.cfm.gql.json stored');
    assert.strictEqual(await result.status, 200);
  });
  it('stores in preview with franklin selector parameter', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 'a/b/c',
            selector: 'franklin',
            payload: {
              test: 'value',
            },
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.franklin.json stored');
    assert.strictEqual(await result.status, 200);
  });
  it('stores variation', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 'a/b/c',
            variation: 'max',
            payload: {
              test: 'value',
            },
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.json/variations/max stored');
    assert.strictEqual(await result.status, 200);
  });

  it('stores in live success', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            action: 'store',
            mode: 'live',
            tenant: 'local',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/live/a/b/c.json stored');
    assert.strictEqual(await result.status, 200);
  });
  it('stores in live with franklin selector success', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            action: 'store',
            mode: 'live',
            selector: 'franklin',
            tenant: 'local',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/live/a/b/c.franklin.json stored');
    assert.strictEqual(await result.status, 200);
  });
  it('touch in live with franklin selector success', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            action: 'touch',
            mode: 'live',
            selector: 'franklin',
            tenant: 'local',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/live/a/b/c touched');
    assert.strictEqual(await result.status, 200);
  });
  it('touch in preview with franklin selector success', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            action: 'touch',
            mode: 'preview',
            selector: 'franklin',
            tenant: 'local',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/preview/a/b/c touched');
    assert.strictEqual(await result.status, 200);
  });
  it('evicts in live remove from live only', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/live/a/b/c.json/variations/v1' },
          { Key: 'local/live/a/b/c.json/variations/v2' },
        ],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/preview/a/b/c.json/variations/v1' },
          { Key: 'local/preview/a/b/c.json/variations/v2' },
        ],
      });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            mode: 'live',
            action: 'evict',
            tenant: 'local',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.match(await result.text(), /.*live.* evicted/);
    assert.strictEqual(s3Mock.commandCalls(ListObjectsV2Command).length, 2);
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectsCommand).length, 1);
    assert.strictEqual(await result.status, 200);
  });
  it('evicts in preview implicitly remove from live', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/live/a/b/c.json/variations/v1' },
          { Key: 'local/live/a/b/c.json/variations/v2' },
        ],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/preview/a/b/c.json/variations/v1' },
          { Key: 'local/preview/a/b/c.json/variations/v2' },
        ],
      });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            mode: 'preview',
            action: 'evict',
            tenant: 'local',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.match(await result.text(), /.*live.*preview.* evicted/);
    assert.strictEqual(s3Mock.commandCalls(ListObjectsV2Command).length, 4);
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectsCommand).length, 2);
    assert.strictEqual(await result.status, 200);
  });
  it('evicts in live success', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/live/a/b/c.json/variations/v1' },
          { Key: 'local/live/a/b/c.json/variations/v2' },
        ],
      });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            mode: 'live',
            action: 'evict',
            tenant: 'local',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/live/a/b/c.json,local/live/a/b/c.json/variations/v1,local/live/a/b/c.json/variations/v2 evicted');
    assert.strictEqual(await result.status, 200);
  });
  it('evicts folder in preview implicitly also in live', async () => {
    nock('http://localhost')
      .post('/endpoint')
      .times(2)
      .reply(200, {});
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/live/a/b/c.json' },
          { Key: 'local/live/a/b/c.json/variations/v1' },
          { Key: 'local/live/a/b/c.json/variations/v2' },
        ],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/preview/a/b/c.json' },
          { Key: 'local/preview/a/b/c.json/variations/v1' },
          { Key: 'local/preview/a/b/c.json/variations/v2' },
        ],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            mode: 'preview',
            action: 'evict',
            tenant: 'local',
            selector: 'cfm.gql',
            relPath: 'a/b',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.status, 200);
    assert.match(await result.text(), /.*live.*preview.* evicted/);
    assert.strictEqual(s3Mock.commandCalls(ListObjectsV2Command).length, 4);
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectsCommand).length, 2);
  });
  describe('cleanup variation', () => {
    let eventCaptor = [];
    function eventCaptorMatcher(body) {
      if (body.event && body.event.variation) {
        eventCaptor.push(body.event.variation);
      }
      return true;
    }
    function mockRequest(mode) {
      return new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, ...headers },
          body: JSON.stringify({
            mode,
            action: 'cleanup',
            tenant: 'local',
            selector: 'cfm.gql',
            relPath: 'a/b/c',
            keptVariations: ['var1', 'var2'],
          }),
        },
      );
    }
    it('nothing to evict', async () => {
      nock('http://localhost')
        .post('/endpoint', eventCaptorMatcher)
        .times(2)
        .reply(200, {});
      const s3Mock = mockClient(S3Client);
      s3Mock.on(ListObjectsV2Command)
        .resolvesOnce({
          IsTruncated: false,
          Contents: [],
        });
      const resultPreview = await main(
        mockRequest('preview'),
        {},
      );
      assert.strictEqual(await resultPreview.text(), 'no variations found, so nothing to got evicted');
      assert.strictEqual(await resultPreview.status, 200);
      assert.strictEqual(JSON.stringify(eventCaptor), JSON.stringify([]));
    });
    it('mode preview', async () => {
      nock('http://localhost')
        .post('/endpoint', eventCaptorMatcher)
        .times(2)
        .reply(200, {});
      const s3Mock = mockClient(S3Client);
      s3Mock.on(ListObjectsV2Command)
        .resolvesOnce({
          IsTruncated: false,
          Contents: [
            { Key: 'local/preview/a/b/c.cfm.gql.json/variations/var1' },
            { Key: 'local/preview/a/b/c.cfm.gql.json/variations/var2' },
            { Key: 'local/preview/a/b/c.cfm.gql.json/variations/max' },
          ],
        });
      const resultPreview = await main(
        mockRequest('preview'),
        {},
      );
      assert.strictEqual(await resultPreview.text(), 'local/preview/a/b/c.cfm.gql.json/variations/max evicted');
      assert.strictEqual(await resultPreview.status, 200);
      assert.strictEqual(JSON.stringify(eventCaptor), JSON.stringify(['max']));
    });
    it('mode live', async () => {
      nock('http://localhost')
        .post('/endpoint', eventCaptorMatcher)
        .times(2)
        .reply(200, {});
      const s3Mock = mockClient(S3Client);
      s3Mock.on(ListObjectsV2Command)
        .resolvesOnce({
          IsTruncated: false,
          Contents: [
            { Key: 'local/live/a/b/c.cfm.gql.json/variations/var1' },
            { Key: 'local/live/a/b/c.cfm.gql.json/variations/var2' },
            { Key: 'local/live/a/b/c.cfm.gql.json/variations/max' },
          ],
        });
      eventCaptor = [];
      const resultLive = await main(
        mockRequest('live'),
        {},
      );
      assert.strictEqual(await resultLive.text(), 'local/live/a/b/c.cfm.gql.json/variations/max evicted');
      assert.strictEqual(await resultLive.status, 200);
      assert.strictEqual(JSON.stringify(eventCaptor), JSON.stringify(['max']));
    });
  });
});

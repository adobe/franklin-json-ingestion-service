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
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import nock from 'nock';
import { main } from '../src/index.js';
import { APPLICATION_JSON } from '../src/constants.js';

function setupSettingMock(s3Mock, settings) {
  const source = JSON.stringify(settings);
  const key = 'local/settings.json';
  s3Mock
    .on(GetObjectCommand, {
      Key: key,
    })
    .resolves({
      Body: { transformToString: () => source },
    });
}

describe('Index Tests', () => {
  it('index function is present', async () => {
    const result = await main(new Request('https://localhost/'), {});
    assert.strictEqual(await result.status, 405);
  });
  it('only POST allowed', async () => {
    const result = await main(new Request('https://localhost/', { method: 'PUT' }), {});
    assert.strictEqual(await result.status, 405);
  });
  it('stores in preview as implicit operation', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
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
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.cfm.gql.json stored');
    assert.strictEqual(await result.status, 200);
  });
  it('stores empty data no settings', async () => {
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'Please call settings action to setup pulling client');
    assert.strictEqual(await result.status, 400);
  });

  it('stores empty data invalid', async () => {
    const s3Mock = mockClient(S3Client);
    setupSettingMock(s3Mock, {
      preview: {
        baseURL: 'http://author-localhost',
        authorization: 'Bearer token',
      },
      live: {
        baseURL: 'http://publish-localhost',
      },
    });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'Empty data, nothing to store');
    assert.strictEqual(await result.status, 400);
  });
  it('stores in preview', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
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
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.cfm.gql.json stored');
    assert.strictEqual(await result.status, 200);
  });
  it('store call pullContent with no payload', async () => {
    const responseData = { data: { test: 'value' } };
    nock('http://publish-localhost')
      .get(/\/content\/dam\/a\/b\/c.cfm.gql.json\?ck=.*/)
      .reply(200, responseData);
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });

    setupSettingMock(s3Mock, {
      preview: {
        baseURL: 'http://author-localhost',
        authorization: 'Bearer token',
      },
      live: {
        baseURL: 'http://publish-localhost',
      },
    });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'local',
            mode: 'live',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'local/live/a/b/c.cfm.gql.json stored');
    assert.strictEqual(await result.status, 200);
  });
  it('stores variation', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
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
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.cfm.gql.json/variations/max stored');
    assert.strictEqual(await result.status, 200);
  });

  it('stores in live success', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });

    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            action: 'store',
            mode: 'live',
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
    assert.strictEqual(await result.text(), 'local/live/a/b/c.cfm.gql.json stored');
    assert.strictEqual(await result.status, 200);
  });
  it('setup settings success', async () => {
    const s3Mock = mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            action: 'settings',
            tenant: 'local',
            relPath: 'settings.json',
            payload: {
              preview: {
                baseURL: 'http://author-localhost',
              },
              live: {
                baseURL: 'http://publish-localhost',
              },
            },
          }),
        },
      ),
      {},
    );
    assert.strictEqual(s3Mock.commandCalls(PutObjectCommand).length, 1);
    assert.strictEqual(await result.text(), 'settings stored under local/settings.json');
    assert.strictEqual(await result.status, 200);
  });
  it('setup settings invalid', async () => {
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            action: 'settings',
            tenant: 'local',
            relPath: 'settings.json',
            payload: {
            },
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.text(), 'Invalid settings value');
    assert.strictEqual(await result.status, 400);
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
          { Key: 'local/live/a/b/c.cfm.gql.json/variations/v1' },
          { Key: 'local/live/a/b/c.cfm.gql.json/variations/v2' },
        ],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/preview/a/b/c.cfm.gql.json/variations/v1' },
          { Key: 'local/preview/a/b/c.cfm.gql.json/variations/v2' },
        ],
      });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
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
  it('evicts in preview should not remove from live', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/preview/a/b/c.cfm.gql.json/variations/v1' },
          { Key: 'local/preview/a/b/c.cfm.gql.json/variations/v2' },
        ],
      });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
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
    assert.match(await result.text(), /.*preview.* evicted/);
    assert.strictEqual(s3Mock.commandCalls(ListObjectsV2Command).length, 2);
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectsCommand).length, 1);
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
          { Key: 'local/live/a/b/c.cfm.gql.json/variations/v1' },
          { Key: 'local/live/a/b/c.cfm.gql.json/variations/v2' },
        ],
      });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
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
    assert.strictEqual(await result.text(), 'local/live/a/b/c.cfm.gql.json,local/live/a/b/c.cfm.gql.json/variations/v1,local/live/a/b/c.cfm.gql.json/variations/v2 evicted');
    assert.strictEqual(await result.status, 200);
  });
  it('evicts folder in preview should not remove in live', async () => {
    nock('http://localhost')
      .post('/endpoint')
      .times(2)
      .reply(200, {});
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/preview/a/b/c.cfm.gql.json' },
          { Key: 'local/preview/a/b/c.cfm.gql.json/variations/v1' },
          { Key: 'local/preview/a/b/c.cfm.gql.json/variations/v2' },
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
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            mode: 'preview',
            action: 'evict',
            tenant: 'local',
            relPath: 'a/b',
          }),
        },
      ),
      {},
    );
    assert.strictEqual(await result.status, 200);
    assert.match(await result.text(), /.*preview.* evicted/);
    assert.strictEqual(s3Mock.commandCalls(ListObjectsV2Command).length, 2);
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectsCommand).length, 1);
  });
});

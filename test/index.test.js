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
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { main } from '../src/index.js';

describe('Index Tests', () => {
  it('index function is present', async () => {
    const result = await main(new Request('https://localhost/'), {});
    assert.strictEqual(await result.text(), 'Currently only POST is implemented');
    assert.strictEqual(await result.status, 405);
  });
  it('store in preview success', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'store',
            mode: 'preview',
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
  it('store in live success', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
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
  it('delete in preview success', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command).resolves({
      IsTruncated: false,
      Contents: [
        { Key: 'local/preview/a/b/c.json' },
        { Key: 'local/preview/a/b/c.v1.json' },
        { Key: 'local/preview/a/b/c.v2.json' },
      ],
    });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
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
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.json,local/preview/a/b/c.v1.json,local/preview/a/b/c.v2.json evicted');
    assert.strictEqual(await result.status, 200);
  });
  it('delete in live success', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command).resolves({
      IsTruncated: false,
      Contents: [
        { Key: 'local/live/a/b/c.json' },
        { Key: 'local/live/a/b/c.v1.json' },
        { Key: 'local/live/a/b/c.v2.json' },
      ],
    });
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
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
    assert.strictEqual(await result.text(), 'local/live/a/b/c.json,local/live/a/b/c.v1.json,local/live/a/b/c.v2.json evicted');
    assert.strictEqual(await result.status, 200);
  });
});

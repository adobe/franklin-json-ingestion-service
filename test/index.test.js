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
    assert.strictEqual(await result.status, 405);
  });
  it('only POST allowed', async () => {
    const result = await main(new Request('https://localhost/', { method: 'PUT' }), {});
    assert.strictEqual(await result.status, 405);
  });
  it('stores in preview as implicit operation', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
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
          headers: { 'content-type': 'application/json' },
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
          headers: { 'content-type': 'application/json' },
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
          headers: { 'content-type': 'application/json' },
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
  it('stores in live with franklin selector success', async () => {
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
          headers: { 'content-type': 'application/json' },
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
    assert.strictEqual(await result.text(), 'local/live/a/b/c.franklin.json touched');
    assert.strictEqual(await result.status, 200);
  });
  it('touch in preview with franklin selector success', async () => {
    mockClient(S3Client);
    const result = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
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
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.franklin.json touched');
    assert.strictEqual(await result.status, 200);
  });
  it('evicts in preview success', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command).resolves({
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
    assert.strictEqual(await result.text(), 'local/preview/a/b/c.json,local/preview/a/b/c.json/variations/v1,local/preview/a/b/c.json/variations/v2 evicted');
    assert.strictEqual(await result.status, 200);
  });
  it('evicts in live success', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command).resolves({
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
    assert.strictEqual(await result.text(), 'local/live/a/b/c.json,local/live/a/b/c.json/variations/v1,local/live/a/b/c.json/variations/v2 evicted');
    assert.strictEqual(await result.status, 200);
  });
  it('evict key fails on internal error', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command).rejects('Error');
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
    assert.strictEqual(await result.status, 500);
    assert.strictEqual(await result.text(), 'An error occurred while trying to evict key(s) in S3 bucket due to Error');
  });
});

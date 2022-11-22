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
import {
  S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand,
  ListObjectsV2Command, DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import assert from 'assert';
import Storage from '../src/storage.js';

describe('Storage Tests', () => {
  it('putKey call PutObjectCommand one time', async () => {
    const s3Mock = mockClient(S3Client);
    const key = 'local/preview/a/b/c.json';
    const payload = {
      test: 'value',
    };
    const result = await new Storage().putKey(key, payload);
    assert.strictEqual(s3Mock.commandCalls(PutObjectCommand).length, 1);
    assert.strictEqual(result, key);
  });
  it('deleteKey call DeleteObjectCommand one time', async () => {
    const s3Mock = mockClient(S3Client);
    const key = 'local/preview/a/b/c.json';
    const result = await new Storage().deleteKey(key);
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectCommand).length, 1);
    assert.strictEqual(result, key);
  });
  it('copyKey call CopyObjectCommand one time', async () => {
    const s3Mock = mockClient(S3Client);
    const sourceKey = 'local/preview/a/b/c.json';
    const targetKey = 'local/live/a/b/c.json';
    const result = await new Storage().copyKey(sourceKey, targetKey);
    assert.strictEqual(s3Mock.commandCalls(CopyObjectCommand).length, 1);
    assert.strictEqual(result, targetKey);
  });
  it('listKeys call ListObjectsV2Command 2 times', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command, {
      Bucket: 'franklin-content-bus-headless',
      Prefix: 'local/preview/a/b/c.',
    }).resolves({
      IsTruncated: true,
      NextContinuationToken: 'cont-token',
      Contents: [
        { Key: 'local/preview/a/b/c.json' },
        { Key: 'local/preview/a/b/c.v1.json' },
        { Key: 'local/preview/a/b/c.v2.json' },
      ],
    }).on(ListObjectsV2Command, {
      ContinuationToken: 'cont-token',
      Bucket: 'franklin-content-bus-headless',
      Prefix: 'local/preview/a/b/c.',
    }).resolves({
      IsTruncated: false,
      Contents: [
        { Key: 'local/preview/a/b/c.v3.json' },
        { Key: 'local/preview/a/b/c.v4.json' },
        { Key: 'local/preview/a/b/c.v5.json' },
      ],
    });
    const keyPrefix = 'local/preview/a/b/c.';
    const result = await new Storage().listKeys(keyPrefix);
    assert.strictEqual(s3Mock.commandCalls(ListObjectsV2Command).length, 2);
    assert.strictEqual(result.length, 6);
  });
  it('evictKeys call DeleteObjectCommand 3 times', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command).resolves({
      IsTruncated: false,
      Contents: [
        { Key: 'local/preview/a/b/c.json' },
        { Key: 'local/preview/a/b/c.v1.json' },
        { Key: 'local/preview/a/b/c.v2.json' },
      ],
    });
    const keyPrefix = 'local/preview/a/b/c.';
    const result = await new Storage().evictKeys(keyPrefix);
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectsCommand).length, 1);
    assert.strictEqual(result.length, 3);
  });
});

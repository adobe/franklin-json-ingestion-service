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
  ListObjectsV2Command, GetObjectCommand,
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
  it('putKey fails on invalid payload value', async () => {
    const key = 'local/preview/a/b/c.json';
    const payload = 10;
    await assert.rejects(
      async () => new Storage().putKey(key, payload),
      {
        message: 'Invalid parameters payload value, accept:{...} object',
      },
    );
  });
  it('putKey fails on internal operation error', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(PutObjectCommand).rejects('Invalid Operation');
    const key = 'local/preview/a/b/c.json';
    const payload = { };
    await assert.rejects(
      async () => new Storage().putKey(key, payload),
      {
        message: 'An error occurred while trying to store local/preview/a/b/c.json in S3 bucket due to Invalid Operation',
      },
    );
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
  it('copyKey fails on internal operation error', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(CopyObjectCommand).rejects('Invalid Operation');
    const sourceKey = 'local/preview/a/b/c.json';
    const targetKey = 'local/live/a/b/c.json';
    await assert.rejects(
      async () => new Storage().copyKey(sourceKey, targetKey),
      {
        message: `An error occurred while trying to copy ${sourceKey} to ${targetKey} in S3 bucket due to Invalid Operation`,
      },
    );
  });
  it('listKeys call ListObjectsV2Command 1 time with empty Contents', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command, {
      Bucket: 'franklin-content-bus-headless',
      Prefix: 'local/preview/a/b/c.',
    }).resolves({
      IsTruncated: false,
    });
    const keyPrefix = 'local/preview/a/b/c.';
    const result = await new Storage().listKeys(keyPrefix);
    assert.strictEqual(s3Mock.commandCalls(ListObjectsV2Command).length, 1);
    assert.strictEqual(result.length, 0);
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
  it('getKey call GetObjectCommand 2 times', async () => {
    const s3Mock = mockClient(S3Client);
    const source = JSON.stringify({ test: 'data' });
    const mockedData = Buffer.from(source);
    s3Mock
      .on(GetObjectCommand)
      .rejectsOnce('Error')
      .resolvesOnce({
        Body: { toString: () => mockedData },
      });
    const key = 'local/preview/a/b/c.json';
    const result = await new Storage().getKey(key);
    assert.strictEqual(s3Mock.commandCalls(GetObjectCommand).length, 2);
    assert.strictEqual(JSON.stringify(result), source);
  });
  it('getKey fails after 3 attempts', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock
      .on(GetObjectCommand)
      .rejects('Error');
    const key = 'local/preview/a/b/c.json';
    await assert.rejects(
      async () => new Storage().getKey(key),
      {
        message: `An error occurred while trying to read ${key} in S3 bucket due to Error after several attempts`,
      },
    );
    assert.strictEqual(s3Mock.commandCalls(GetObjectCommand).length, 3);
  });
  it('evictKeys call DeleteObjectCommand 3 times', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command).resolves({
      IsTruncated: false,
      Contents: [
        { Key: 'local/preview/a/b/c.json/variations/v1' },
        { Key: 'local/preview/a/b/c.json/variations/v2' },
      ],
    });
    const keyPrefix = 'local/preview/a/b/c.';
    const result = await new Storage().evictKeys(keyPrefix);
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectCommand).length, 3);
    assert.strictEqual(result.length, 3);
  });
  it('evictKey fails on error', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(DeleteObjectCommand).rejects('Error');
    const key = 'local/preview/a/b/c.json';
    await assert.rejects(
      async () => new Storage().evictKey(key),
      {
        message: 'An error occurred while trying to evict key in S3 bucket due to Error',
      },
    );
  });
});

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
  S3Client, PutObjectCommand,
  ListObjectsV2Command, GetObjectCommand, DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import assert from 'assert';
import Storage from '../src/storage.js';

const initialEnv = Object.assign({}, process.env);
describe('Storage Tests', () => {
  after(() => {
    process.env = initialEnv;
  });
  it('doesnt uses forcePathStyle for non local setup', async () => {
    process.env.AWS_ENDPOINT_URL = 'http://aws-host:9000';
    const s3Mock = mockClient(S3Client);
    const result = new Storage();
    assert.strictEqual(result.s3.config.forcePathStyle, false);
  });
  it('uses forcePathStyle for localhost setup', async () => {
    process.env.AWS_ENDPOINT_URL = 'http://localhost:9000';
    const s3Mock = mockClient(S3Client);
    const result = new Storage();
    assert.strictEqual(result.s3.config.forcePathStyle, true);
  });
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
  it('getKey success', async () => {
    const s3Mock = mockClient(S3Client);
    const data = { test: 'data' };
    const source = JSON.stringify(data);
    const key = 'local/preview/a/b/c.json';
    s3Mock
      .on(GetObjectCommand, {
        Key: key,
      })
      .resolves({
        Body: { transformToString: () => source },
      });
    const resultingJson = await new Storage().getKey(key);
    assert.deepStrictEqual(resultingJson, data);
  });
  it('getKey fails if not found', async () => {
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
    assert.strictEqual(s3Mock.commandCalls(GetObjectCommand).length, 1);
  });
  it('evictKeys call DeleteObjectsCommand 1 times', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
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
    const keyPrefix = 'local/preview/a/b/c.';
    const result = await new Storage().evictKeys(keyPrefix);
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectsCommand).length, 1);
    assert.strictEqual(result.length, 3);
  });
  it('evictKeys fails on error', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command).resolves({
      IsTruncated: false,
      Contents: [
        { Key: 'local/preview/a/b/c.json/variations/v1' },
        { Key: 'local/preview/a/b/c.json/variations/v2' },
      ],
    });
    s3Mock.on(DeleteObjectsCommand).rejects('Error');
    const key = 'local/preview/a/b/c.json';
    await assert.rejects(
      async () => new Storage().evictKeys(key),
      {
        message: 'An error occurred while trying to evict key(s) in S3 bucket due to deleteKeys failed Error',
      },
    );
  });
});

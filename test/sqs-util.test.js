/*
 * Copyright 2023 Adobe. All rights reserved.
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
  S3Client,
  ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import nock from 'nock';
import { processMessage } from '../src/sqs-util.js';

const s3Mock = mockClient(S3Client);

describe('SQS Util Tests', () => {
  beforeEach(() => {
    nock.cleanAll();
    nock.restore();
    nock.activate();
    s3Mock.reset();
    s3Mock.on(GetObjectCommand)
      .resolvesOnce(
        {
          Body: {
            transformToString: () => JSON.stringify({
              preview: {
                baseURL: 'http://author-localhost',
              },
              live: {
                baseURL: 'http://publish-localhost',
              },
            }),
          },
        },
      );
  });
  it('process sqs records store skipped on 404', async () => {
    nock('http://author-localhost')
      .get(/\/content\/dam\/a\/b\/c.cfm.gql.json/)
      .reply(404);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });
    await processMessage({ cachedSettings: [], log: console }, {
      tenant: 'local',
      relPath: 'a/b/c',
      mode: 'preview',
      action: 'store',
    });
    assert.strictEqual(s3Mock.commandCalls(GetObjectCommand).length, 1);
    assert.strictEqual(s3Mock.commandCalls(PutObjectCommand).length, 0);
  });
  it('process sqs records store success', async () => {
    nock('http://author-localhost')
      .get(/\/content\/dam\/a\/b\/c.cfm.gql.json/)
      .reply(200, {
        body: JSON.stringify({
          test: 'value',
        }),
      });
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });
    await processMessage({ cachedSettings: [], log: console }, {
      tenant: 'local',
      relPath: 'a/b/c',
      mode: 'preview',
      action: 'store',
    });
    assert.strictEqual(s3Mock.commandCalls(GetObjectCommand).length, 1);
    assert.strictEqual(s3Mock.commandCalls(PutObjectCommand).length, 1);
  });
  it('process sqs records store with variations success', async () => {
    nock('http://author-localhost')
      .get(/\/content\/dam\/a\/b\/c.cfm.gql.json/)
      .reply(200, {
        data: {
          test: 'value',
          _variations: [
            'var1',
          ],
        },
      });
    nock('http://author-localhost')
      .get(/\/content\/dam\/a\/b\/c.cfm.gql.var1.json/)
      .reply(200, {
        data: {
          test: 'value2',
        },
      });
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });
    await processMessage({ cachedSettings: [], log: console }, {
      tenant: 'local',
      relPath: 'a/b/c',
      mode: 'preview',
      action: 'store',
    });
    assert.strictEqual(s3Mock.commandCalls(GetObjectCommand).length, 1);
    assert.strictEqual(s3Mock.commandCalls(PutObjectCommand).length, 2);
  });
  it('process sqs records evict success', async () => {
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/live/a/b/c/a1.cfm.gql.json' },
        ],
      })
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'local/live/a/b/c.cfm.gql.json/variations/v1' },
          { Key: 'local/live/a/b/c.cfm.gql.json/variations/v2' },
        ],
      });
    await processMessage({ cachedSettings: [], log: console }, {
      tenant: 'local',
      relPath: 'a/b/c',
      mode: 'preview',
      action: 'evict',
    });
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectsCommand).length, 1);
    const calls = s3Mock.commandCalls(DeleteObjectsCommand);
    assert.deepStrictEqual(calls[0].firstArg.input, {
      Bucket: 'franklin-content-bus-headless',
      Delete: {
        Objects: [
          {
            Key: 'local/preview/a/b/c.cfm.gql.json',
          },
          {
            Key: 'local/live/a/b/c/a1.cfm.gql.json',
          },
          {
            Key: 'local/live/a/b/c.cfm.gql.json/variations/v1',
          },
          {
            Key: 'local/live/a/b/c.cfm.gql.json/variations/v2',
          },
        ],
      },
    });
  });
});

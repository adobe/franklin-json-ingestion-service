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
  PutObjectCommand, GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  SQSClient,
} from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import nock from 'nock';
import { main } from '../src/index.js';
import { APPLICATION_JSON } from '../src/constants.js';

describe('Index Tests', () => {
  beforeEach(() => {
    mockClient(SQSClient);
    nock.cleanAll();
    nock.restore();
    nock.activate();
  });
  it('index function is present', async () => {
    const result = await main(new Request('https://localhost/'), {});
    assert.strictEqual(await result.status, 405);
  });
  it('only POST allowed', async () => {
    const result = await main(new Request('https://localhost/', { method: 'PUT' }), {});
    assert.strictEqual(await result.status, 405);
  });
  it('process sqs records with failures', async () => {
    const result = await main({
      headers: {
        has: () => false,
      },
    }, {
      records: [{
        messageId: '123',
        body: JSON.stringify({
          action: 'store',
          tenant: 'local',
          relPath: 'a/b/c',
          mode: 'preview',
        }),
      }],
    });
    assert.deepStrictEqual(await result.batchItemFailures, [{
      itemIdentifier: '123',
    }]);
  });
  it('process sqs records with no failures', async () => {
    nock('http://author-localhost')
      .get(/\/content\/dam\/a\/b\/c.cfm.gql.json/)
      .reply(200, {
        body: JSON.stringify({
          test: 'value',
        }),
      });
    const s3Mock = mockClient(S3Client);
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
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });
    const result = await main({
      headers: {
        has: () => false,
      },
    }, {
      globalContent: [],
      records: [{
        messageId: '123',
        body: JSON.stringify({
          action: 'store',
          tenant: 'local',
          relPath: 'a/b/c',
          mode: 'preview',
        }),
      }],
    });
    assert.deepStrictEqual(await result.batchItemFailures, []);
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
    assert.strictEqual(await result.text(), 'processing store in background');
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
});

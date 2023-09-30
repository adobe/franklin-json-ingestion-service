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
} from '@aws-sdk/client-s3';
import {
  SQSClient,
} from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import nock from 'nock';
import { GetParameterCommand, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
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
    await assert.rejects(async () => {
      await main({
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
    });
  }, Error);
  it('process sqs records with no failures', async () => {
    nock('http://author-localhost')
      .get(/\/content\/dam\/a\/b\/c.cfm.gql.json/)
      .reply(200, {
        body: JSON.stringify({
          test: 'value',
        }),
      });
    const ssmMock = mockClient(SSMClient);
    ssmMock.on(GetParameterCommand)
      .resolvesOnce(
        {
          Parameter: {
            Value: JSON.stringify({
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
    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [],
      });
    const response = await main({
      headers: {
        has: () => false,
      },
    }, {
      cachedSettings: [],
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
    assert.deepStrictEqual(response.status, 200);
  });
  it('process create parallel queue for array of relPath', async () => {
    const response = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            action: 'store',
            tenant: 'local',
            relPath: ['a/b/c', 'a/b/d'],
            mode: 'preview',
          }),
        },
      ),
      {},
    );
    assert.deepStrictEqual(response.status, 200);
    assert.deepStrictEqual(await response.text(), 'processing store in background');
  });
  it('ignore cleanup', async () => {
    const response = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            action: 'cleanup',
            tenant: 'local',
          }),
        },
      ),
      {},
    );
    assert.deepStrictEqual(response.status, 200);
    assert.deepStrictEqual(await response.text(), 'cleanup is deprecated, ignored for now');
  });
  it('ignore variation parameter', async () => {
    const response = await main(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            action: 'store',
            tenant: 'local',
            variation: 'var1',
            relPath: 'a/b/c',
          }),
        },
      ),
      {},
    );
    assert.deepStrictEqual(response.status, 200);
    assert.deepStrictEqual(await response.text(), 'parameter variation is deprecated, ignoring request now');
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
    const ssmMock = mockClient(SSMClient);
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
    assert.strictEqual(ssmMock.commandCalls(PutParameterCommand).length, 1);
    assert.strictEqual(await result.text(), 'settings stored under /franklin-aem-store/local/settings.json');
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

/*
 * Copyright 2022 Adobe. All rights reserved.
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
import { mockClient } from 'aws-sdk-client-mock';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import FullyHydrated from '../src/fullyhydrated.js';

const mockedContext = { log: console };

describe('Fully Hydrated Tests', () => {
  it('computeCacheKey with variation', () => {
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', 'var1');
    assert.strictEqual(fullyHydrated.cacheKey, 'tenant/preview/a/b/c.json/variations/var1/cache');
  });
  it('computeCacheKey without variation', () => {
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', '');
    assert.strictEqual(fullyHydrated.cacheKey, 'tenant/preview/a/b/c.json/cache');
  });
  it('computeDerivedKey with variation', () => {
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', 'var2');
    assert.strictEqual(fullyHydrated.computeDerivedKey('var1'), 'tenant/preview/a/b/c.json/variations/var1');
  });
  it('computeDerivedKey without variation', () => {
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', 'var2');
    assert.strictEqual(fullyHydrated.computeDerivedKey(), 'tenant/preview/a/b/c.json');
  });
  it('extractModelPath from CF json', () => {
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', '');
    assert.strictEqual(
      fullyHydrated.extractModelPath(
        { _model: { _path: '/_model_/model1' } },
      ),
      'tenant/preview/_model_/model1',
    );
  });
  it('loadFullyHydratedFromReferences from CF json', async () => {
    const s3Mock = mockClient(S3Client);
    const source = JSON.stringify({ test: 'data' });
    s3Mock
      .on(GetObjectCommand, {
        Key: 'tenant/preview/h/i/j.json/cache',
      })
      .resolves({
        Body: { toString: () => source },
      })
      .on(GetObjectCommand, {
        Key: 'tenant/preview/e/f/g.json/cache',
      })
      .resolves({
        Body: { toString: () => source },
      });
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', '');
    const results = await fullyHydrated.loadFullyHydratedFromReferences(['/h/i/j', '/e/f/g']);
    assert.strictEqual(results.length, 2);
    assert.deepEqual(results, [
      { ref: '/h/i/j', value: { test: 'data' } },
      { ref: '/e/f/g', value: { test: 'data' } },
    ]);
  });
  it('computeFullyHydrated from CF variation json with fallback', async () => {
    const s3Mock = mockClient(S3Client);
    const source = { _model: { _path: '/_model_/model1' }, test: 'data' };
    const modelSource = {
      properties: {
        test: {
          type: 'string',
        },
      },
    };
    const mockedData = JSON.stringify(source);
    const mockedModelData = JSON.stringify(modelSource);
    s3Mock
      .on(GetObjectCommand, {
        Key: 'tenant/preview/r/t/u.json/variations/max_22',
      })
      .rejects('Not found')
      .on(GetObjectCommand, {
        Key: 'tenant/preview/r/t/u.json',
      })
      .resolves({
        Body: { toString: () => mockedData },
      })
      .on(GetObjectCommand, {
        Key: 'tenant/preview/_model_/model1.json',
      })
      .resolves({
        Body: { toString: () => mockedModelData },
      });
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/r/t/u', 'max_22');
    const fallbackJson = await fullyHydrated.computeFullyHydrated();
    assert.deepEqual(fallbackJson, source);
  });
  it('computeFullyHydrated from CF return null on missing model', async () => {
    const s3Mock = mockClient(S3Client);
    const source = { _model: { _path: '/_model_/model1' }, test: 'data' };
    const mockedData = JSON.stringify(source);
    s3Mock
      .on(GetObjectCommand, {
        Key: 'tenant/preview/r/t/u.json',
      })
      .resolves({
        Body: { toString: () => mockedData },
      })
      .on(GetObjectCommand, {
        Key: 'tenant/preview/_model_/model1.json',
      })
      .rejects('No Model Found');
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/r/t/u', '');
    const resultingJson = await fullyHydrated.computeFullyHydrated();
    assert.strictEqual(resultingJson, null);
  });
  it('getModel returns null if model is missing', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(GetObjectCommand, {
      Key: 'tenant/preview/_model_/model1.json',
    }).rejects('Not found');
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', '');
    const modelJson = await fullyHydrated.getModel('tenant/preview/_model_/model1.json');
    assert.strictEqual(modelJson, null);
  });
  it('getFullyHydrated returns null if not found', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock
      .on(GetObjectCommand, {
        Key: 'tenant/preview/a/b/c.json/cache',
      })
      .rejects('Not found')
      .on(GetObjectCommand, {
        Key: 'tenant/preview/a/b/c.json',
      })
      .rejects('Not found');
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', '');
    const fullyHydratedJson = await fullyHydrated.getFullyHydrated();
    assert.strictEqual(fullyHydratedJson, null);
  });
  it('getFullyHydrated returns null if model is missing', async () => {
    const s3Mock = mockClient(S3Client);
    const source = { _model: { _path: '/_model_/model1' } };
    const mockedData = JSON.stringify(source);
    s3Mock
      .on(GetObjectCommand, {
        Key: 'tenant/preview/a/b/c.json/cache',
      })
      .rejects('Not found')
      .on(GetObjectCommand, {
        Key: 'tenant/preview/a/b/c.json',
      })
      .resolves({
        Body: {
          read: () => mockedData,
        },
      })
      .on(GetObjectCommand, {
        Key: 'tenant/preview/_model_/model1.json',
      })
      .rejects('Not found');
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', '');
    const fullyHydratedJson = await fullyHydrated.getFullyHydrated();
    assert.strictEqual(fullyHydratedJson, null);
  });
  it('getFullyHydrated from CF json', async () => {
    const s3Mock = mockClient(S3Client);
    const source = { _model: { _path: '/_model_/model1' }, field1: 'hello', field2: '/u/v/w' };
    const source2 = { _model: { _path: '/_model_/model1' }, field1: 'world' };
    const modelSource = {
      properties: {
        field1: {
          type: 'string',
        },
        field2: {
          type: 'object',
          anyOf: [{
            $dynamicRef: '#/model1',
          }],
        },
      },
    };
    const mockedData = JSON.stringify(source);
    const mockedData2 = JSON.stringify(source2);
    const mockedModelData = JSON.stringify(modelSource);
    s3Mock
      .on(GetObjectCommand, {
        Key: 'tenant/preview/a/b/c.json/cache',
      })
      .rejects('Not found')
      .on(GetObjectCommand, {
        Key: 'tenant/preview/a/b/c.json',
      })
      .resolves({
        Body: { toString: () => mockedData },
      })
      .on(GetObjectCommand, {
        Key: 'tenant/preview/_model_/model1.json',
      })
      .resolvesOnce({
        Body: { toString: () => mockedModelData },
      })
      .resolvesOnce({
        Body: { toString: () => mockedModelData },
      })
      .on(GetObjectCommand, {
        Key: 'tenant/preview/u/v/w.json',
      })
      .resolves({
        Body: { toString: () => mockedData2 },
      });
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', '');
    const fullyHydratedJson = await fullyHydrated.getFullyHydrated();
    const expectedJson = {
      _model: { _path: '/_model_/model1' },
      field1: 'hello',
      field2: {
        _model: { _path: '/_model_/model1' },
        field1: 'world',
      },
    };
    assert.deepEqual(fullyHydratedJson, expectedJson);
    assert.strictEqual(s3Mock.commandCalls(PutObjectCommand).length, 2);
  });
  it('getFullyHydrated silently fail to store result as cache', async () => {
    const s3Mock = mockClient(S3Client);
    const source = { _model: { _path: '/_model_/model1' }, field1: 'hello' };
    const modelSource = {
      properties: {
        field1: {
          type: 'string',
        },
      },
    };
    const mockedData = JSON.stringify(source);
    const mockedModelData = JSON.stringify(modelSource);
    s3Mock
      .on(GetObjectCommand, {
        Key: 'tenant/preview/a/b/c.json/cache',
      })
      .rejects('Not found')
      .on(GetObjectCommand, {
        Key: 'tenant/preview/a/b/c.json',
      })
      .resolves({
        Body: { toString: () => mockedData },
      })
      .on(GetObjectCommand, {
        Key: 'tenant/preview/_model_/model1.json',
      })
      .resolves({
        Body: { toString: () => mockedModelData },
      })
      .on(PutObjectCommand)
      .rejects('Put Error');
    const fullyHydrated = new FullyHydrated(mockedContext, 'tenant/preview/a/b/c', '');
    const fullyHydratedJson = await fullyHydrated.getFullyHydrated();
    assert.deepEqual(fullyHydratedJson, source);
    assert.strictEqual(s3Mock.commandCalls(PutObjectCommand).length, 1);
  });
});

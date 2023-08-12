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
import {
  S3Client,
  ListObjectsV2Command, DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import nock from 'nock';
import Storage from '../src/storage.js';
import VariationsUtil from '../src/variations-util.js';

describe('Variations Utils Tests', () => {
  it('call store on collected variations', async () => {
    nock('http://awslocalhost')
      .post('/endpoint', {
        tenant: 'localhost',
        action: 'store',
        mode: 'preview',
        variation: 'var2',
        relPath: 'a/b/c',
      })
      .reply(200, {})
      .post('/endpoint', {
        tenant: 'localhost',
        action: 'store',
        mode: 'preview',
        variation: 'var1',
        relPath: 'a/b/c',
      })
      .reply(200, {});

    const s3Mock = mockClient(S3Client);
    s3Mock.on(ListObjectsV2Command)
      .resolvesOnce({
        IsTruncated: false,
        Contents: [
          { Key: 'localhost/preview/a/b/c.cfm.gql.json/variations/var1' },
          { Key: 'localhost/preview/a/b/c.cfm.gql.json/variations/var2' },
          { Key: 'localhost/preview/a/b/c.cfm.gql.json/variations/var3' },
        ],
      });
    const storage = new Storage();
    const varUtil = new VariationsUtil(
      { log: console },
      'http://awslocalhost/endpoint',
      {
        tenant: 'localhost',
        mode: 'preview',
        relPath: 'a/b/c',
      },
      storage,
    );
    await varUtil.process({
      _variations: ['var1', 'var2'],
    });
    assert.strictEqual(s3Mock.commandCalls(DeleteObjectsCommand).length, 1);
  });
});

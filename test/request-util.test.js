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

import { Request } from '@adobe/fetch';
import zlib from 'zlib';
import assert from 'assert';
import RequestUtil from '../src/request-util.js';
import { APPLICATION_JSON } from '../src/constants.js';

describe('RequestUtil Tests', () => {
  it('fails on invalid content-type', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': 'text/html' },
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Invalid request content type please check the API for details');
  });
  it('fails on missing tenant', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: '{}',
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Invalid parameters tenantId value, accept: [a..zA-Z0-9\\-_]');
  });
  it('fails on missing relPath', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'local',
          }),
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Invalid parameters relPath value, should not start with /');
  });
  it('fails on invalid relPath type', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 10,
          }),
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Invalid parameters relPath value, should not start with /');
  });
  it('fails on invalid relPath value', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'local',
            relPath: '/a/b/c',
          }),
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Invalid parameters relPath value, should not start with /');
  });
  it('fails on invalid mode value', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 'a/b/c',
            mode: 'any',
          }),
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Invalid parameters mode value, accept:preview,live');
  });
  it('fails on invalid action value', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 'a/b/c',
            mode: 'preview',
            action: 'any',
          }),
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Invalid parameters action value, accept:store,evict,touch,cleanup');
  });
  it('fails on invalid tenant value', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'some+id',
          }),
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Invalid parameters tenantId value, accept: [a..zA-Z0-9\\-_]');
  });
  it('fails on missing keptVariation value when cleanup', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: JSON.stringify({
            tenant: 'local',
            relPath: 'a/b/c',
            mode: 'preview',
            action: 'cleanup',
          }),
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Invalid parameter missing keptVariations parameter for cleanup');
  });
  it('fails on invalid json payload', async () => {
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON },
          body: '{ test: invalid, }',
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, false);
    assert.strictEqual(reqUtil.errorStatusCode, 400);
    assert.strictEqual(reqUtil.errorMessage, 'Error while parsing the body as json due to Unexpected token t in JSON at position 2');
  });
  it('support gzip compressed request', async () => {
    const jsonBody = JSON.stringify({
      tenant: 'local',
      relPath: 'a/b/c',
      mode: 'preview',
      action: 'store',
      payload: {
        test: 1,
      },
    });
    const reqUtil = new RequestUtil(
      new Request(
        'https://localhost/',
        {
          method: 'POST',
          headers: { 'content-type': APPLICATION_JSON, 'Transfer-Encoding': 'chuncked', 'Content-Encoding': 'gzip' },
          body: zlib.gzipSync(jsonBody),
        },
      ),
      {},
    );
    await reqUtil.validate();
    assert.strictEqual(reqUtil.isValid, true);
  });
});

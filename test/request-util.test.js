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
import RequestUtil from '../src/request-util.js';
import { SERVICE_ENDPOINT_NAME } from '../src/constants.js';

describe('RequestUtil Tests', () => {
  it('undefined key and variation if not expected url format', async () => {
    const result = new RequestUtil({ url: '' });
    assert.strictEqual(result.getKey(), undefined);
    assert.strictEqual(result.getVariation(), undefined);
  });
  it('valid key and empty variation if variation is not set in the url format', async () => {
    const result = new RequestUtil({ url: `${SERVICE_ENDPOINT_NAME}/a/b/c.cfm.gql.json` });
    assert.strictEqual(result.getKey(), 'a/b/c');
    assert.strictEqual(result.getVariation(), undefined);
  });
  it('valid key and variation if variation is set in the url format', async () => {
    const result = new RequestUtil({ url: `${SERVICE_ENDPOINT_NAME}/a/b/c.cfm.gql.max_22.json` });
    assert.strictEqual(result.getKey(), 'a/b/c');
    assert.strictEqual(result.getVariation(), 'max_22');
  });
});

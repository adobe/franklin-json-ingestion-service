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
import nock from 'nock';
import PullingClient from '../src/pulling-client.js';

describe('PullingClient Tests', () => {
  beforeEach(() => {
    nock.cleanAll();
    nock.restore();
    nock.activate();
  });
  it('pullContent success', async () => {
    const responseData = { data: { test: 'value' } };
    nock('http://localhost')
      .get(/\/content\/dam\/ccsurfaces\/en_US\/landing-page.cfm.gql.json\?ck=.*/)
      .reply(200, responseData);
    const result = await new PullingClient({ log: console }, 'http://localhost')
      .pullContent('ccsurfaces/en_US/landing-page');
    assert.deepStrictEqual(result, responseData);
  });
  it('pullContent with authorization header success', async () => {
    const responseData = { data: { test: 'value' } };
    nock('http://localhost')
      .get(/\/content\/dam\/ccsurfaces\/en_US\/landing-page.cfm.gql.json\?ck=.*/)
      .matchHeader('Authorization', 'Bearer token')
      .reply(200, responseData);
    const result = await new PullingClient(null, 'http://localhost', 'Bearer token')
      .pullContent('ccsurfaces/en_US/landing-page');
    assert.deepStrictEqual(result, responseData);
  });
  it('pullContent with variation success', async () => {
    const responseData = { data: { test: 'value' } };
    nock('http://localhost')
      .get(/\/content\/dam\/ccsurfaces\/en_US\/landing-page.cfm.gql.myvar.json\?ck=.*/)
      .reply(200, responseData);
    const result = await new PullingClient(null, 'http://localhost', 'Bearer token')
      .pullContent('ccsurfaces/en_US/landing-page', 'myvar');
    assert.deepStrictEqual(result, responseData);
  });
  it('pullContent failed', async () => {
    nock('http://localhost')
      .get(/\/content\/dam\/ccsurfaces\/en_US\/landing-page.cfm.gql.json\?ck=.*/)
      .reply(404, {});
    const result = await new PullingClient({ log: console }, 'http://localhost')
      .pullContent('ccsurfaces/en_US/landing-page');
    assert.strictEqual(result, undefined);
  });
  it('pullContent invalid url', async () => {
    await assert.rejects(async () => {
      await new PullingClient({ log: console }).pullContent('invalid/url');
    }, (err) => {
      assert.strictEqual(err.name, 'Error');
      assert.match(err.message, /Pulling content failed for .*/);
      return true;
    });
  });
});

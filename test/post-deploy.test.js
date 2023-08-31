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
import { noCache, fetch } from '@adobe/fetch';
import util from 'util';
import { createTargets } from './post-deploy-utils.js';

const sleep = util.promisify(setTimeout);
const MAX_RETRIES = 50;

async function check(tenant, mode, suffix, expected, retries) {
  if (retries < 0) {
    throw new Error('too many retries');
  }
  const checkRes = await fetch(`https://api.experiencecloud.live/delivery/${tenant}/${mode}/${suffix}`, {
    cache: 'no-store',
    headers: {
      'x-api-key': process.env.EXPERIENCE_CLOUD_TOKEN,
    },
  });
  if (checkRes.status !== expected) {
    await sleep(1000);
    await check(tenant, mode, suffix, expected, retries ? retries - 1 : 0);
  }
}

createTargets().forEach((target) => {
  describe(`Post-Deploy Tests (${target.title()})`, () => {
    const fetchContext = noCache();
    console.log('using', target.host(), target.urlPath());

    afterEach(() => {
      fetchContext.reset();
    });

    it('returns the status of the function', async () => {
      const res = await fetch(`${target.host()}${target.urlPath()}/_status_check/healthcheck.json`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      delete json.process;
      delete json.response_time;
      // status returns 0.0.0+ci123 for ci versions
      const version = target.version.startsWith('ci')
        ? `0.0.0+${target.version}`
        : target.version;
      assert.deepStrictEqual(json, {
        status: 'OK',
        version,
      });
    }).timeout(50000);

    it('invokes the function', async () => {
      const res = await fetch(`${target.host()}${target.urlPath()}`);
      assert.strictEqual(res.status, 405);
    }).timeout(50000);

    it('re-store sample in preview', async () => {
      const tenant = 'localhost';
      const mode = 'live';
      const relPath = 'ccsurfaces/AppCatalog/en_US/appsPDP/AEFT';
      const evictRes = await fetch(`${target.host()}${target.urlPath()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant,
          action: 'evict',
          relPath,
          mode,
        }),
      });
      assert.strictEqual(evictRes.status, 200);
      await check(tenant, mode, `${relPath}.cfm.gql.json`, 404, MAX_RETRIES);
      await check(tenant, mode, `${relPath}.cfm.gql.max_22.json`, 404, MAX_RETRIES);
      await check(tenant, mode, `${relPath}.cfm.gql.cch.json`, 404, MAX_RETRIES);
      const res = await fetch(`${target.host()}${target.urlPath()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant,
          action: 'store',
          relPath,
          mode,
        }),
      });
      assert.strictEqual(res.status, 200);
      await check(tenant, mode, `${relPath}.cfm.gql.json`, 200, MAX_RETRIES);
      await check(tenant, mode, `${relPath}.cfm.gql.max_22.json`, 200, MAX_RETRIES);
      await check(tenant, mode, `${relPath}.cfm.gql.cch.json`, 200, MAX_RETRIES);
    }).timeout(50000);
  });
});

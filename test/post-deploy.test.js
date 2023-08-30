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
import { noCache } from '@adobe/fetch';
import util from 'util';
import { createTargets } from './post-deploy-utils.js';

const sleep = util.promisify(setTimeout);

async function check(url) {
  const checkRes = await fetch(url);
  if (checkRes.status !== 200) {
    await sleep(1000);
    await check(url);
  }
}

createTargets().forEach((target) => {
  describe(`Post-Deploy Tests (${target.title()})`, () => {
    const fetchContext = noCache();
    const { fetch } = fetchContext;

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
      const evictRes = await fetch(`${target.host()}${target.urlPath()}`, {
        method: 'POST',
        body: {
          tenant: 'localhost',
          action: 'evict',
          relPath: 'ccsurfaces/AppCatalog/en_US/appsPDP/AEFT',
          mode: 'live',
        },
      });
      assert.strictEqual(evictRes.status, 200);
      const res = await fetch(`${target.host()}${target.urlPath()}`, {
        method: 'POST',
        body: {
          tenant: 'localhost',
          action: 'store',
          relPath: 'ccsurfaces/AppCatalog/en_US/appsPDP/AEFT',
          mode: 'live',
        },
      });
      assert.strictEqual(res.status, 200);
      await check('https://dev-odin.adobe.com/content/dam/ccsurfaces/AppCatalog/en_US/appsPDP/AEFT.cfm.gql.json');
    }).timeout(50000);
  });
});

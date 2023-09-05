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
import { fetch } from '@adobe/fetch';

export default class PullingClient {
  constructor(context, baseURL, authorization) {
    this.context = context || { log: console };
    this.baseURL = baseURL;
    this.authorization = authorization;
  }

  async pullContent(key, variation) {
    let content;
    const varSelector = variation ? `.${variation}` : '';
    // note the // is intentional to avoid using cloudflare workers but really use origin
    const url = `${this.baseURL}//content/dam/${key}.cfm.gql${varSelector}.json?ck=${Date.now()}`;
    const headers = {};
    if (this.authorization) {
      headers.Authorization = this.authorization;
    }
    const startTime = Date.now();
    this.context.log.info(`pulling content from ${url} initiated`);
    const response = await fetch(url, { method: 'GET', headers });
    const elapsedTime = Date.now() - startTime;
    this.context.log.info(`pulling content from ${url} completed in ${elapsedTime}ms`);
    if (response.status === 200) {
      this.context.log.info(`pulling content from ${url} success`);
      content = await response.json();
    } else if (response.status === 404) {
      this.context.log.info(`pulling content from ${url} failed due to ${response.status} code, skipping`);
      return null;
    } else {
      this.context.log.info(`pulling content from ${url} failed due to ${response.status} code`);
      throw new Error(`Pulling content failed for ${url} due to ${response.status} code`);
    }
    return content;
  }
}
